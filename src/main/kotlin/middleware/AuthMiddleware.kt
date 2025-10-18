package com.middleware

import com.model.User
import com.model.UserRole
import com.repository.UserRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*

class AuthMiddleware {
	private val userRepository = UserRepository()

	suspend fun validateApiKey(call: ApplicationCall): User? {
		val apiKey = call.request.headers["X-API-Key"]
		if (apiKey == null) {
			call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "API key required"))
			return null
		}

		val user = userRepository.findByApiKey(apiKey)
		if (user == null) {
			call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Invalid API key"))
			return null
		}

		return user
	}

	suspend fun requireRole(call: ApplicationCall, vararg allowedRoles: UserRole): User? {
		val user = validateApiKey(call) ?: return null

		if (user.role !in allowedRoles) {
			call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Insufficient permissions"))
			return null
		}

		return user
	}
}

// Extension functions for easier use in routes
suspend fun ApplicationCall.authenticateUser(authMiddleware: AuthMiddleware): User? {
	return authMiddleware.validateApiKey(this)
}

suspend fun ApplicationCall.requireEditor(authMiddleware: AuthMiddleware): User? {
	return authMiddleware.requireRole(this, UserRole.Editor, UserRole.Admin)
}

suspend fun ApplicationCall.requireAdmin(authMiddleware: AuthMiddleware): User? {
	return authMiddleware.requireRole(this, UserRole.Admin)
}
