package util

import com.model.JsonPatchOperation

/**
 * Utility for formatting JSON Patch operations into human-readable change descriptions
 */
object PatchFormatter {

    /**
     * Convert a list of patches into human-readable change descriptions
     * Example: "name changed from 'Old' to 'New'"
     */
    fun formatChanges(patches: List<JsonPatchOperation>): List<String> {
        return patches.mapNotNull { patch ->
            when (patch.op) {
                "replace" -> {
                    val fieldPath = patch.path.trimStart('/')
                    val fieldName = fieldPath.split('/').firstOrNull() ?: fieldPath
                    val newValue = formatValue(patch.value)
                    "$fieldName changed to $newValue"
                }
                "add" -> {
                    val fieldPath = patch.path.trimStart('/')
                    val fieldName = fieldPath.split('/').firstOrNull() ?: fieldPath
                    val newValue = formatValue(patch.value)
                    "$fieldName added: $newValue"
                }
                "remove" -> {
                    val fieldPath = patch.path.trimStart('/')
                    val fieldName = fieldPath.split('/').firstOrNull() ?: fieldPath
                    "$fieldName removed"
                }
                else -> null
            }
        }
    }

    /**
     * Format a patch value for display
     * Truncates long values and handles special cases
     */
    private fun formatValue(value: String?): String {
        if (value == null) return "null"

        // Remove surrounding quotes if present
        val cleanValue = value.trim().removeSurrounding("\"")

        // Truncate if too long
        return if (cleanValue.length > 50) {
            "${cleanValue.take(47)}..."
        } else {
            cleanValue
        }
    }

    /**
     * Create a concise summary of changes
     * Example: "3 fields changed: name, description, type"
     */
    fun createSummary(changedFields: List<String>?, changeDescription: String?): String {
        return when {
            changeDescription != null -> changeDescription
            changedFields != null && changedFields.isNotEmpty() -> {
                val count = changedFields.size
                val fieldList = if (count <= 3) {
                    changedFields.joinToString(", ")
                } else {
                    "${changedFields.take(3).joinToString(", ")} and ${count - 3} more"
                }
                "$count field${if (count > 1) "s" else ""} changed: $fieldList"
            }
            else -> "No changes recorded"
        }
    }
}
