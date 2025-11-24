package util

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.*
import com.fasterxml.jackson.databind.module.SimpleModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.flipkart.zjsonpatch.JsonPatch
import com.model.Event
import com.model.JsonPatchOperation
import org.bson.types.ObjectId

/**
 * Utility for reconstructing Event objects from base snapshots and JSON Patch diffs
 * Recalculates excluded calculated fields after applying patches
 */
object EventReconstructor {
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
     * Reconstruct an Event by applying a sequence of JSON Patch operations to a base event
     *
     * @param baseEvent The base event (typically version 1)
     * @param patches List of JSON Patch operations to apply sequentially
     * @return The reconstructed Event with calculated fields recomputed
     */
    fun reconstruct(baseEvent: Event, patches: List<JsonPatchOperation>): Event {
        if (patches.isEmpty()) {
            // No patches to apply, just recalculate fields on base event
            return recalculateFields(baseEvent)
        }

        // Serialize base event to Jackson JsonNode
        var currentNode: JsonNode = objectMapper.valueToTree(baseEvent)

        // Apply patches sequentially
        for (patch in patches) {
            val patchNode = convertToJsonPatchNode(patch)
            currentNode = JsonPatch.apply(patchNode, currentNode)
        }

        // Deserialize back to Event using Jackson
        val reconstructedEvent = objectMapper.treeToValue(currentNode, Event::class.java)

        // Recalculate excluded calculated fields
        return recalculateFields(reconstructedEvent)
    }

    /**
     * Reconstruct an Event by applying multiple patch lists sequentially
     * Useful when reconstructing from version 1 through multiple intermediate versions
     *
     * @param baseEvent The base event (version 1)
     * @param patchLists List of patch lists, one for each version
     * @return The reconstructed Event
     */
    fun reconstructThroughVersions(
        baseEvent: Event,
        patchLists: List<List<JsonPatchOperation>>
    ): Event {
        // Flatten all patches and apply them sequentially
        val allPatches = patchLists.flatten()
        return reconstruct(baseEvent, allPatches)
    }

    /**
     * Recalculate fields that were excluded from diffs
     * This includes: calculatedAbsoluteDate, calculatedExactDate, displayYear
     *
     * Note: This only handles simple cases (exact dates).
     * For relative dates, the caller (EventRepository) must recalculate these fields
     * using DateCalculator with repository access.
     */
    private fun recalculateFields(event: Event): Event {
        // For exact dates, we can calculate absolute date and display year
        if (event.exactDate != null) {
            val absoluteDate = com.util.DateCalculator.exactDateToDays(event.exactDate)
            val displayYear = event.exactDate.year

            return event.copy(
                calculatedAbsoluteDate = absoluteDate,
                calculatedExactDate = event.exactDate,
                displayYear = displayYear
            )
        }

        // For relative dates or approximations, return as-is
        // The repository will need to recalculate these fields with access to referenced events
        return event
    }

    /**
     * Convert our JsonPatchOperation to a Jackson JsonNode for zjsonpatch
     */
    private fun convertToJsonPatchNode(patch: JsonPatchOperation): JsonNode {
        val patchJson = buildString {
            append("[{")
            append("\"op\":\"${patch.op}\"")
            append(",\"path\":\"${patch.path}\"")
            if (patch.value != null) {
                // Value is already a JSON string, include it directly
                append(",\"value\":${patch.value}")
            }
            if (patch.from != null) {
                append(",\"from\":\"${patch.from}\"")
            }
            append("}]")
        }
        return objectMapper.readTree(patchJson)
    }
}
