package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Era
import com.model.Event
import com.repository.EraRepository
import com.repository.EventRepository
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

fun Route.eraRoutes() {
	val eraRepository = EraRepository()
	val eventRepository = EventRepository()
	val authMiddleware = AuthMiddleware()

	route("/api/eras") {
		// Get all eras (public)
		get {
			install(NotarizedRoute()) {
				tags = setOf("Eras")
				get = GetInfo.builder {
					summary("Get all eras")
					description("Retrieve all historical eras in the One Piece timeline")
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Era>>()
						description("List of all eras")
					}
					canRespond {
						responseCode(HttpStatusCode.InternalServerError)
						responseType<Map<String, String>>()
						description("Internal server error")
					}
				}
			}

			try {
				val eras = eraRepository.findAll()
				call.respond(HttpStatusCode.OK, eras)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch eras: ${e.message}"))
			}
		}

		// Get era by ID (public)
		get("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Eras")
				get = GetInfo.builder {
					summary("Get era by ID")
					description("Retrieve a specific era by its unique identifier")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Era ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Era>()
						description("Era details")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Era not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing era ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing era ID"))
				return@get
			}

			try {
				val era = eraRepository.findById(id)
				if (era == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Era not found"))
				} else {
					call.respond(HttpStatusCode.OK, era)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch era: ${e.message}"))
			}
		}

		// Get timeline (all events) for an era (public)
		get("/{id}/timeline") {
			install(NotarizedRoute()) {
				tags = setOf("Eras")
				get = GetInfo.builder {
					summary("Get era timeline")
					description("Retrieve all events that occurred during a specific era")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Era ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Event>>()
						description("Timeline of events in the era")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Era not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing era ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing era ID"))
				return@get
			}

			try {
				val era = eraRepository.findById(id)
				if (era == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Era not found"))
					return@get
				}

				val events = eventRepository.findByDateRange(era.startDate, era.endDate)
				call.respond(HttpStatusCode.OK, events)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch era timeline: ${e.message}"))
			}
		}

		// Create era (requires editor or admin)
		post {
			install(NotarizedRoute()) {
				tags = setOf("Eras")
				post = PostInfo.builder {
					summary("Create new era")
					description("Create a new historical era. Requires Editor or Admin role.")
					request {
						requestType<Era>()
						description("Era data")
					}
					response {
						responseCode(HttpStatusCode.Created)
						responseType<Era>()
						description("Created era with generated ID")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
				}
			}

			val user = call.requireEditor(authMiddleware) ?: return@post

			try {
				val era = call.receive<Era>()
				val createdEra = eraRepository.create(era, user.username)
				call.respond(HttpStatusCode.Created, createdEra)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to create era: ${e.message}"))
			}
		}

		// Update era (requires editor or admin)
		put("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Eras")
				put = PutInfo.builder {
					summary("Update era")
					description("Update an existing era. Requires Editor or Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Era ID"
						)
					)
					request {
						requestType<Era>()
						description("Updated era data")
					}
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Era>()
						description("Updated era")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Era not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing era ID")
					}
				}
			}

			val user = call.requireEditor(authMiddleware) ?: return@put

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing era ID"))
				return@put
			}

			try {
				val era = call.receive<Era>()
				val updatedEra = eraRepository.update(id, era, user.username)
				if (updatedEra == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Era not found"))
				} else {
					call.respond(HttpStatusCode.OK, updatedEra)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update era: ${e.message}"))
			}
		}

		// Delete era (admin only)
		delete("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Eras")
				delete = DeleteInfo.builder {
					summary("Delete era")
					description("Delete an era. Requires Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Era ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Map<String, String>>()
						description("Era deleted successfully")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Era not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing era ID")
					}
				}
			}

			val user = call.requireAdmin(authMiddleware) ?: return@delete

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing era ID"))
				return@delete
			}

			try {
				val deleted = eraRepository.delete(id)
				if (deleted) {
					call.respond(HttpStatusCode.OK, mapOf("message" to "Era deleted successfully"))
				} else {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Era not found"))
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete era: ${e.message}"))
			}
		}
	}
}
