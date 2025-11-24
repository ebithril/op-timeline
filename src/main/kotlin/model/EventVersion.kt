package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

@Serializable
data class EventVersion(
	@Contextual
	val _id: ObjectId? = null,
	@Contextual
	val eventId: ObjectId,
	val version: Int,

	// Legacy field for backward compatibility (deprecated, use baseSnapshot or patches)
	val event: Event? = null,

	// New diff-based fields
	/** Type of version: "snapshot" (version 1) or "diff" (versions 2+) */
	val versionType: String = "snapshot",

	/** Base snapshot for version 1 only (null for diff versions) */
	val baseSnapshot: Event? = null,

	/** JSON Patch operations for diff versions (null for snapshot versions) */
	val patches: List<JsonPatchOperation>? = null,

	/** List of field paths that changed in this version (for quick summary display) */
	val changedFields: List<String>? = null,

	// Metadata
	val changedBy: String,
	val changedAt: Long = System.currentTimeMillis(),
	val changeDescription: String? = null
)
