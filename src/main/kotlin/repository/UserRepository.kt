package com.repository

import com.config.DatabaseConfig
import com.model.User
import com.model.UserRole
import com.mongodb.client.model.Filters
import com.mongodb.kotlin.client.coroutine.MongoCollection
import kotlinx.coroutines.flow.toList
import org.bson.types.ObjectId
import java.security.SecureRandom
import java.util.Base64

class UserRepository {
	private val database = DatabaseConfig.getDatabase()
	private val usersCollection: MongoCollection<User> = database.getCollection("users")

	suspend fun findAll(): List<User> {
		return usersCollection.find().toList()
	}

	suspend fun findById(id: String): User? {
		val objectId = try {
			ObjectId(id)
		} catch (e: Exception) {
			return null
		}
		return usersCollection.find(Filters.eq("_id", objectId)).toList().firstOrNull()
	}

	suspend fun findByApiKey(apiKey: String): User? {
		return usersCollection.find(
			Filters.and(
				Filters.eq("apiKey", apiKey),
				Filters.eq("isActive", true)
			)
		).toList().firstOrNull()
	}

	suspend fun findByUsername(username: String): User? {
		return usersCollection.find(Filters.eq("username", username)).toList().firstOrNull()
	}

	suspend fun create(username: String, role: UserRole): User {
		val apiKey = generateApiKey()
		val user = User(
			_id = ObjectId(),
			username = username,
			apiKey = apiKey,
			role = role,
			createdAt = System.currentTimeMillis()
		)
		usersCollection.insertOne(user)
		return user
	}

	suspend fun deactivate(id: String): Boolean {
		val user = findById(id) ?: return false
		val deactivatedUser = user.copy(isActive = false)
		usersCollection.replaceOne(Filters.eq("_id", user._id), deactivatedUser)
		return true
	}

	suspend fun updateRole(id: String, newRole: UserRole): User? {
		val user = findById(id) ?: return null
		val updatedUser = user.copy(role = newRole)
		usersCollection.replaceOne(Filters.eq("_id", user._id), updatedUser)
		return updatedUser
	}

	private fun generateApiKey(): String {
		val random = SecureRandom()
		val bytes = ByteArray(32)
		random.nextBytes(bytes)
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
	}
}
