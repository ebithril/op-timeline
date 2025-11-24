package com.model

import kotlinx.serialization.Serializable

/**
 * Represents a single JSON Patch operation according to RFC 6902
 * Used for storing diffs between event versions instead of full snapshots
 */
@Serializable
data class JsonPatchOperation(
    /** The operation type: "add", "remove", "replace", "move", "copy", or "test" */
    val op: String,

    /** JSON Pointer path to the field being modified (e.g., "/name", "/sources/0/chapter") */
    val path: String,

    /** The value for add/replace operations as JSON string (null for remove operations) */
    val value: String? = null,

    /** The source path for move/copy operations */
    val from: String? = null
)
