package util

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.*
import com.fasterxml.jackson.databind.module.SimpleModule
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.flipkart.zjsonpatch.JsonDiff
import com.model.Event
import com.model.JsonPatchOperation
import org.bson.types.ObjectId

/**
 * Utility for generating JSON Patch diffs between Event objects
 * Excludes calculated fields to reduce storage size
 */
object EventDiffer {
    private val objectMapper: ObjectMapper = jacksonObjectMapper().apply {
        // Register custom ObjectId serializer/deserializer
        val module = SimpleModule()
        module.addSerializer(ObjectId::class.java, ObjectIdSerializer())
        module.addDeserializer(ObjectId::class.java, ObjectIdDeserializer())
        registerModule(module)
    }

    // Custom serializer for ObjectId
    private class ObjectIdSerializer : JsonSerializer<ObjectId>() {
        override fun serialize(value: ObjectId, gen: JsonGenerator, serializers: SerializerProvider) {
            gen.writeString(value.toHexString())
        }
    }

    // Custom deserializer for ObjectId
    private class ObjectIdDeserializer : JsonDeserializer<ObjectId>() {
        override fun deserialize(p: JsonParser, ctxt: DeserializationContext): ObjectId {
            return ObjectId(p.text)
        }
    }

    /**
     * Fields to exclude from diffs (calculated fields that can be regenerated)
     */
    private val EXCLUDED_FIELDS = setOf(
        "calculatedAbsoluteDate",
        "calculatedExactDate",
        "displayYear"
    )

    /**
     * Generate JSON Patch operations representing the difference between oldEvent and newEvent
     *
     * @param oldEvent The previous version of the event
     * @param newEvent The new version of the event
     * @return List of JSON Patch operations describing the changes
     */
    fun generateDiff(oldEvent: Event, newEvent: Event): List<JsonPatchOperation> {
        // Serialize events to JSON, excluding calculated fields
        val oldJson = serializeEventForDiff(oldEvent)
        val newJson = serializeEventForDiff(newEvent)

        // Convert to Jackson JsonNode for zjsonpatch
        val oldNode: JsonNode = objectMapper.readTree(oldJson)
        val newNode: JsonNode = objectMapper.readTree(newJson)

        // Generate JSON Patch using zjsonpatch
        val patchNode: JsonNode = JsonDiff.asJson(oldNode, newNode)

        // Convert to our JsonPatchOperation model
        return convertToJsonPatchOperations(patchNode)
    }

    /**
     * Extract list of changed field paths from a list of JSON Patch operations
     * Useful for creating change summaries
     *
     * @param patches List of JSON Patch operations
     * @return List of field paths that were changed (e.g., ["name", "description", "sources/0/chapter"])
     */
    fun extractChangedFields(patches: List<JsonPatchOperation>): List<String> {
        return patches
            .mapNotNull { patch ->
                when (patch.op) {
                    "add", "remove", "replace" -> {
                        // Extract field name from path (e.g., "/name" -> "name", "/sources/0/chapter" -> "sources")
                        patch.path.trimStart('/').split('/').firstOrNull()
                    }
                    "move", "copy" -> {
                        // For move/copy, both from and path are affected
                        val fromField = patch.from?.trimStart('/')?.split('/')?.firstOrNull()
                        val toField = patch.path.trimStart('/').split('/').firstOrNull()
                        listOfNotNull(fromField, toField).firstOrNull()
                    }
                    else -> null
                }
            }
            .distinct()
            .filter { it.isNotEmpty() }
    }

    /**
     * Serialize Event to JSON string, excluding calculated fields
     * Uses Jackson to avoid ObjectId serialization issues
     */
    private fun serializeEventForDiff(event: Event): String {
        // Serialize to Jackson JsonNode
        val jsonNode = objectMapper.valueToTree<JsonNode>(event)

        // Remove excluded fields if it's an object node
        if (jsonNode is ObjectNode) {
            EXCLUDED_FIELDS.forEach { field ->
                jsonNode.remove(field)
            }
        }

        return objectMapper.writeValueAsString(jsonNode)
    }

    /**
     * Convert zjsonpatch JsonNode result to our JsonPatchOperation model
     */
    private fun convertToJsonPatchOperations(patchNode: JsonNode): List<JsonPatchOperation> {
        if (!patchNode.isArray) {
            return emptyList()
        }

        return patchNode.map { operationNode ->
            val op = operationNode.get("op")?.asText() ?: "replace"
            val path = operationNode.get("path")?.asText() ?: ""
            val value = operationNode.get("value")?.toString()  // Store as JSON string
            val from = operationNode.get("from")?.asText()

            JsonPatchOperation(
                op = op,
                path = path,
                value = value,
                from = from
            )
        }
    }
}
