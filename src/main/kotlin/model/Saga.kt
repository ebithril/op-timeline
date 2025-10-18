package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

@Serializable
data class Saga(
	@Contextual
	val _id: ObjectId? = null,
	val name: String,
	val description: String? = null,
	val order: Int,  // Order in the series (1, 2, 3, etc.)
	val createdAt: Long = System.currentTimeMillis(),
	val createdBy: String? = null,
	val updatedAt: Long = System.currentTimeMillis(),
	val updatedBy: String? = null
)
