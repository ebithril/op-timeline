package com.repository

import com.config.DatabaseConfig
import com.model.Saga
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Sorts
import com.mongodb.kotlin.client.coroutine.MongoCollection
import kotlinx.coroutines.flow.toList
import org.bson.types.ObjectId

class SagaRepository {
	private val database = DatabaseConfig.getDatabase()
	private val sagasCollection: MongoCollection<Saga> = database.getCollection("sagas")

	suspend fun findAll(): List<Saga> {
		return sagasCollection.find()
			.sort(Sorts.ascending("order"))
			.toList()
	}

	suspend fun findById(id: String): Saga? {
		val objectId = try {
			ObjectId(id)
		} catch (e: Exception) {
			return null
		}
		return sagasCollection.find(Filters.eq("_id", objectId)).toList().firstOrNull()
	}

	suspend fun create(saga: Saga, username: String): Saga {
		val newSaga = saga.copy(
			_id = ObjectId(),
			createdAt = System.currentTimeMillis(),
			createdBy = username,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)
		sagasCollection.insertOne(newSaga)
		return newSaga
	}

	suspend fun update(id: String, saga: Saga, username: String): Saga? {
		val existingSaga = findById(id) ?: return null

		val updatedSaga = saga.copy(
			_id = existingSaga._id,
			createdAt = existingSaga.createdAt,
			createdBy = existingSaga.createdBy,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)

		sagasCollection.replaceOne(
			Filters.eq("_id", existingSaga._id),
			updatedSaga
		)

		return updatedSaga
	}

	suspend fun delete(id: String): Boolean {
		val saga = findById(id) ?: return false
		sagasCollection.deleteOne(Filters.eq("_id", saga._id))
		return true
	}
}
