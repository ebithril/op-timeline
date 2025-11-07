package com.routes

import com.middleware.AuthMiddleware
import com.middleware.authenticateUser
import com.middleware.requireAdmin
import com.model.UserRole
import com.repository.UserRepository
import io.bkbn.kompendium.core.metadata.DeleteInfo
import io.bkbn.kompendium.core.metadata.GetInfo
import io.bkbn.kompendium.core.metadata.PostInfo
import io.bkbn.kompendium.core.metadata.PutInfo
import io.bkbn.kompendium.core.plugin.NotarizedRoute
import io.bkbn.kompendium.json.schema.definition.TypeDefinition
import io.bkbn.kompendium.oas.payload.Parameter
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class CreateUserRequest(
	val username: String,
	val role: UserRole
)

@Serializable
data class UpdateRoleRequest(
	val role: UserRole
)

@Serializable
data class UserResponse(
	val username: String,
	val role: UserRole,
	val apiKey: String? = null,
	val createdAt: Long,
	val isActive: Boolean
)

fun Route.userRoutes() {
	val userRepository = UserRepository()
	val authMiddleware = AuthMiddleware()

	route("/api/users") {
		// Get current user info (requires authentication)
		get("/me") {
			install(NotarizedRoute()) {
				tags = setOf("Users")
				get = GetInfo.builder {
					summary("Get current user info")
					description("Get information about the authenticated user. Requires any valid authentication.")
					response {
						responseCode(HttpStatusCode.OK)
						responseType<UserResponse>()
						description("Current user information")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated")
					}
					canRespond {
						responseCode(HttpStatusCode.InternalServerError)
						responseType<Map<String, String>>()
						description("Failed to fetch user info")
					}
				}
			}

			val user = call.authenticateUser(authMiddleware) ?: return@get

			try {
				val response = UserResponse(
					username = user.username,
					role = user.role,
					createdAt = user.createdAt,
					isActive = user.isActive
				)
				call.respond(HttpStatusCode.OK, response)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch user info: ${e.message}"))
			}
		}

		// Create new user (admin only)
		post {
			install(NotarizedRoute()) {
				tags = setOf("Users")
				post = PostInfo.builder {
					summary("Create new user")
					description("Create a new user account with generated API key. Requires Admin role.")
					request {
						requestType<CreateUserRequest>()
						description("User creation request with username and role")
					}
					response {
						responseCode(HttpStatusCode.Created)
						responseType<UserResponse>()
						description("Created user with generated API key (only returned on creation)")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.Conflict)
						responseType<Map<String, String>>()
						description("Username already exists")
					}
					canRespond {
						responseCode(HttpStatusCode.InternalServerError)
						responseType<Map<String, String>>()
						description("Failed to create user")
					}
				}
			}

			val user = call.requireAdmin(authMiddleware) ?: return@post

			try {
				val request = call.receive<CreateUserRequest>()

				// Check if username already exists
				val existingUser = userRepository.findByUsername(request.username)
				if (existingUser != null) {
					call.respond(HttpStatusCode.Conflict, mapOf("error" to "Username already exists"))
					return@post
				}

				val newUser = userRepository.create(request.username, request.role)
				val response = UserResponse(
					username = newUser.username,
					role = newUser.role,
					apiKey = newUser.apiKey,
					createdAt = newUser.createdAt,
					isActive = newUser.isActive
				)
				call.respond(HttpStatusCode.Created, response)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to create user: ${e.message}"))
			}
		}

		// Get all users (admin only)
		get {
			install(NotarizedRoute()) {
				tags = setOf("Users")
				get = GetInfo.builder {
					summary("Get all users")
					description("Retrieve all user accounts. Requires Admin role.")
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<UserResponse>>()
						description("List of all users (API keys not included)")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.InternalServerError)
						responseType<Map<String, String>>()
						description("Failed to fetch users")
					}
				}
			}

			val user = call.requireAdmin(authMiddleware) ?: return@get

			try {
				val users = userRepository.findAll()
				val responses = users.map { u ->
					UserResponse(
						username = u.username,
						role = u.role,
						createdAt = u.createdAt,
						isActive = u.isActive
					)
				}
				call.respond(HttpStatusCode.OK, responses)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch users: ${e.message}"))
			}
		}

		// Update user role (admin only)
		put("/{id}/role") {
			install(NotarizedRoute()) {
				tags = setOf("Users")
				put = PutInfo.builder {
					summary("Update user role")
					description("Update a user's role (Viewer, Editor, or Admin). Requires Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "User ID"
						)
					)
					request {
						requestType<UpdateRoleRequest>()
						description("New role for the user")
					}
					response {
						responseCode(HttpStatusCode.OK)
						responseType<UserResponse>()
						description("Updated user information")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("User not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing user ID")
					}
				}
			}

			val user = call.requireAdmin(authMiddleware) ?: return@put

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing user ID"))
				return@put
			}

			try {
				val request = call.receive<UpdateRoleRequest>()
				val updatedUser = userRepository.updateRole(id, request.role)
				if (updatedUser == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "User not found"))
				} else {
					val response = UserResponse(
						username = updatedUser.username,
						role = updatedUser.role,
						createdAt = updatedUser.createdAt,
						isActive = updatedUser.isActive
					)
					call.respond(HttpStatusCode.OK, response)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update user role: ${e.message}"))
			}
		}

		// Deactivate user (admin only)
		delete("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Users")
				delete = DeleteInfo.builder {
					summary("Deactivate user")
					description("Deactivate a user account (soft delete). Requires Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "User ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Map<String, String>>()
						description("User deactivated successfully")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("User not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing user ID")
					}
				}
			}

			val user = call.requireAdmin(authMiddleware) ?: return@delete

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing user ID"))
				return@delete
			}

			try {
				val deactivated = userRepository.deactivate(id)
				if (deactivated) {
					call.respond(HttpStatusCode.OK, mapOf("message" to "User deactivated successfully"))
				} else {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "User not found"))
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to deactivate user: ${e.message}"))
			}
		}
	}
}
