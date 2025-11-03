package com.repository

import com.config.DatabaseConfig
import com.model.Arc
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Sorts
import com.mongodb.kotlin.client.coroutine.MongoCollection
import kotlinx.coroutines.flow.toList
import org.bson.types.ObjectId

class ArcRepository {
	private val database = DatabaseConfig.getDatabase()
	private val arcsCollection: MongoCollection<Arc> = database.getCollection("arcs")

	suspend fun findAll(): List<Arc> {
		return arcsCollection.find()
			.sort(Sorts.ascending("startChapter"))
			.toList()
	}

	suspend fun findById(id: String): Arc? {
		val objectId = try {
			ObjectId(id)
		} catch (e: Exception) {
			return null
		}
		return arcsCollection.find(Filters.eq("_id", objectId)).toList().firstOrNull()
	}

	suspend fun findBySagaId(sagaId: String): List<Arc> {
		val objectId = try {
			ObjectId(sagaId)
		} catch (e: Exception) {
			return emptyList()
		}
		return arcsCollection.find(Filters.eq("sagaId", objectId))
			.sort(Sorts.ascending("startChapter"))
			.toList()
	}

	suspend fun create(arc: Arc, username: String): Arc {
		val newArc = arc.copy(
			_id = ObjectId(),
			createdAt = System.currentTimeMillis(),
			createdBy = username,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)
		arcsCollection.insertOne(newArc)
		return newArc
	}

	suspend fun update(id: String, arc: Arc, username: String): Arc? {
		val existingArc = findById(id) ?: return null

		val updatedArc = arc.copy(
			_id = existingArc._id,
			createdAt = existingArc.createdAt,
			createdBy = existingArc.createdBy,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)

		arcsCollection.replaceOne(
			Filters.eq("_id", existingArc._id),
			updatedArc
		)

		return updatedArc
	}

	suspend fun delete(id: String): Boolean {
		val arc = findById(id) ?: return false
		arcsCollection.deleteOne(Filters.eq("_id", arc._id))
		return true
	}
}
