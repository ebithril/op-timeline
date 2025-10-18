package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

enum class UserRole {
	Admin, Editor, Viewer
}

@Serializable
data class User(
	@Contextual
	val _id: ObjectId? = null,
	val username: String,
	val apiKey: String,
	val role: UserRole,
	val createdAt: Long = System.currentTimeMillis(),
	val isActive: Boolean = true
)
