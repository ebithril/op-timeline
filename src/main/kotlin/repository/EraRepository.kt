package com.repository

import com.config.DatabaseConfig
import com.model.Era
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Sorts
import com.mongodb.kotlin.client.coroutine.MongoCollection
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import org.bson.types.ObjectId

class EraRepository {
	private val database = DatabaseConfig.getDatabase()
	private val erasCollection: MongoCollection<Era> = database.getCollection("eras")

	suspend fun findAll(): List<Era> {
		return erasCollection.find()
			.sort(Sorts.ascending("startDate.year", "startDate.month", "startDate.day"))
			.toList()
	}

	suspend fun findById(id: String): Era? {
		val objectId = try {
			ObjectId(id)
		} catch (e: Exception) {
			return null
		}
		return erasCollection.find(Filters.eq("_id", objectId)).firstOrNull()
	}

	suspend fun create(era: Era, username: String): Era {
		val newEra = era.copy(
			_id = ObjectId(),
			createdAt = System.currentTimeMillis(),
			createdBy = username,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)
		erasCollection.insertOne(newEra)
		return newEra
	}

	suspend fun update(id: String, era: Era, username: String): Era? {
		val existingEra = findById(id) ?: return null

		val updatedEra = era.copy(
			_id = existingEra._id,
			createdAt = existingEra.createdAt,
			createdBy = existingEra.createdBy,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)

		erasCollection.replaceOne(
			Filters.eq("_id", existingEra._id),
			updatedEra
		)

		return updatedEra
	}

	suspend fun delete(id: String): Boolean {
		val era = findById(id) ?: return false
		erasCollection.deleteOne(Filters.eq("_id", era._id))
		return true
	}
}
