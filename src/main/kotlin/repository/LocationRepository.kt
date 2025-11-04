package com.repository

import com.config.DatabaseConfig
import com.model.Location
import com.model.LocationType
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Sorts
import com.mongodb.kotlin.client.coroutine.MongoCollection
import kotlinx.coroutines.flow.toList
import org.bson.types.ObjectId

class LocationRepository {
	private val database = DatabaseConfig.getDatabase()
	private val locationsCollection: MongoCollection<Location> = database.getCollection("locations")

	suspend fun findAll(): List<Location> {
		return locationsCollection.find()
			.sort(Sorts.ascending("type", "name"))
			.toList()
	}

	suspend fun findById(id: String): Location? {
		val objectId = try {
			ObjectId(id)
		} catch (e: Exception) {
			return null
		}
		return locationsCollection.find(Filters.eq("_id", objectId)).toList().firstOrNull()
	}

	suspend fun findByType(type: LocationType): List<Location> {
		return locationsCollection.find(Filters.eq("type", type))
			.sort(Sorts.ascending("name"))
			.toList()
	}

	suspend fun findByParentId(parentId: String): List<Location> {
		val objectId = try {
			ObjectId(parentId)
		} catch (e: Exception) {
			return emptyList()
		}
		return locationsCollection.find(Filters.eq("parentLocationId", objectId))
			.sort(Sorts.ascending("type", "name"))
			.toList()
	}

	/**
	 * Get the full hierarchy of a location (location + all parents up to root)
	 * Returns list ordered from the location itself to the root parent
	 */
	suspend fun getLocationHierarchy(locationId: String): List<Location> {
		val hierarchy = mutableListOf<Location>()
		var currentLocation = findById(locationId)

		// Prevent infinite loops with a set of visited IDs
		val visited = mutableSetOf<String>()

		while (currentLocation != null) {
			val currentId = currentLocation._id?.toHexString()
			if (currentId != null && currentId in visited) {
				// Circular reference detected, break
				break
			}
			if (currentId != null) {
				visited.add(currentId)
			}

			hierarchy.add(currentLocation)

			// Move to parent
			currentLocation = if (currentLocation.parentLocationId != null) {
				findById(currentLocation.parentLocationId.toHexString())
			} else {
				null
			}
		}

		return hierarchy
	}

	/**
	 * Check if adding parentId to locationId would create a circular reference
	 */
	suspend fun wouldCreateCircularReference(locationId: String, parentId: String): Boolean {
		// If they're the same, it's circular
		if (locationId == parentId) return true

		// Check if parentId's hierarchy contains locationId
		val parentHierarchy = getLocationHierarchy(parentId)
		return parentHierarchy.any { it._id?.toHexString() == locationId }
	}

	suspend fun create(location: Location, username: String): Location {
		// Check for circular references if parent is specified
		if (location._id != null && location.parentLocationId != null) {
			if (wouldCreateCircularReference(
					location._id.toHexString(),
					location.parentLocationId.toHexString()
				)
			) {
				throw IllegalArgumentException("Cannot create location: would create circular reference")
			}
		}

		val timestamp = System.currentTimeMillis()
		val newLocation = location.copy(
			_id = ObjectId(),
			createdAt = timestamp,
			createdBy = username,
			updatedAt = timestamp,
			updatedBy = username
		)
		locationsCollection.insertOne(newLocation)
		return newLocation
	}

	suspend fun update(id: String, location: Location, username: String): Location? {
		val existingLocation = findById(id) ?: return null

		// Check for circular references if parent is being changed
		if (location.parentLocationId != null) {
			if (wouldCreateCircularReference(id, location.parentLocationId.toHexString())) {
				throw IllegalArgumentException("Cannot update location: would create circular reference")
			}
		}

		val updatedLocation = location.copy(
			_id = existingLocation._id,
			createdAt = existingLocation.createdAt,
			createdBy = existingLocation.createdBy,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)

		locationsCollection.replaceOne(
			Filters.eq("_id", existingLocation._id),
			updatedLocation
		)

		return updatedLocation
	}

	suspend fun delete(id: String): Boolean {
		val objectId = try {
			ObjectId(id)
		} catch (e: Exception) {
			return false
		}

		// Check if any locations have this as parent
		val children = findByParentId(id)
		if (children.isNotEmpty()) {
			throw IllegalArgumentException("Cannot delete location: it has child locations")
		}

		val result = locationsCollection.deleteOne(Filters.eq("_id", objectId))
		return result.deletedCount > 0
	}
}
