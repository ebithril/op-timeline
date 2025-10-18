package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

@Serializable
data class Arc(
	@Contextual
	val _id: ObjectId? = null,
	val name: String,
	val description: String? = null,
	@Contextual
	val sagaId: ObjectId? = null,  // Reference to parent saga
	val startChapter: Int? = null,
	val endChapter: Int? = null,
	val startDate: ExactDate? = null,  // When the arc starts in-universe
	val endDate: ExactDate? = null,    // When the arc ends in-universe
	val createdAt: Long = System.currentTimeMillis(),
	val createdBy: String? = null,
	val updatedAt: Long = System.currentTimeMillis(),
	val updatedBy: String? = null
)
