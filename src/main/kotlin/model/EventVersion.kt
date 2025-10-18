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
	val event: Event,
	val changedBy: String,
	val changedAt: Long = System.currentTimeMillis(),
	val changeDescription: String? = null
)
