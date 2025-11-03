package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

@Serializable
data class Era(
	@Contextual
	val _id: ObjectId? = null,
	val name: String,
	val description: String? = null,
	val startDate: ExactDate,  // When the era starts in-universe
	val endDate: ExactDate,    // When the era ends in-universe
	val createdAt: Long = System.currentTimeMillis(),
	val createdBy: String? = null,
	val updatedAt: Long = System.currentTimeMillis(),
	val updatedBy: String? = null
)
