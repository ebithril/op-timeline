package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable

/**
 * Response DTO for version history endpoint
 * Contains human-readable summaries of changes
 */
@Serializable
data class EventVersionResponse(
    val id: String,
    val eventId: String,
    val version: Int,
    val versionType: String,
    val changedBy: String,
    val changedAt: Long,
    val changeDescription: String? = null,
    val changedFields: List<String> = emptyList(),
    val summary: String,
    val changes: List<String> = emptyList(),
    val patches: List<JsonPatchOperation> = emptyList(),

    // Full event for backward compatibility with frontend
    @Contextual
    val event: Event? = null
)
