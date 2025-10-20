package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

enum class LocationType {
	Sea, Island, Kingdom, CityTownVillage
}

@Serializable
data class Location(
	@Contextual
	val _id: ObjectId? = null,
	val name: String,
	val type: LocationType,
	@Contextual
	val parentLocationId: ObjectId? = null,  // Reference to parent location
	val description: String? = null,
	val createdAt: Long = System.currentTimeMillis(),
	val createdBy: String? = null,
	val updatedAt: Long = System.currentTimeMillis(),
	val updatedBy: String? = null
)
