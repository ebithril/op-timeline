package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Arc
import com.model.Event
import com.repository.ArcRepository
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

fun Route.arcRoutes() {
	val arcRepository = ArcRepository()
	val eventRepository = EventRepository()
	val authMiddleware = AuthMiddleware()

	route("/api/arcs") {
		// Get all arcs (public)
		get {
			install(NotarizedRoute()) {
				tags = setOf("Arcs")
				get = GetInfo.builder {
					summary("Get all arcs")
					description("Retrieve all story arcs")
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Arc>>()
						description("List of all arcs")
					}
					canRespond {
						responseCode(HttpStatusCode.InternalServerError)
						responseType<Map<String, String>>()
						description("Internal server error")
					}
				}
			}

			try {
				val arcs = arcRepository.findAll()
				call.respond(HttpStatusCode.OK, arcs)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch arcs: ${e.message}"))
			}
		}

		// Get arc by ID (public)
		get("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Arcs")
				get = GetInfo.builder {
					summary("Get arc by ID")
					description("Retrieve a specific arc by its unique identifier")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Arc ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Arc>()
						description("Arc details")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Arc not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing arc ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing arc ID"))
				return@get
			}

			try {
				val arc = arcRepository.findById(id)
				if (arc == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Arc not found"))
				} else {
					call.respond(HttpStatusCode.OK, arc)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch arc: ${e.message}"))
			}
		}

		// Get arcs by saga ID (public)
		get("/saga/{sagaId}") {
			install(NotarizedRoute()) {
				tags = setOf("Arcs")
				get = GetInfo.builder {
					summary("Get arcs by saga")
					description("Retrieve all arcs belonging to a specific saga")
					parameters = listOf(
						Parameter(
							name = "sagaId",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Saga ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Arc>>()
						description("List of arcs in the saga")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing saga ID")
					}
				}
			}

			val sagaId = call.parameters["sagaId"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing saga ID"))
				return@get
			}

			try {
				val arcs = arcRepository.findBySagaId(sagaId)
				call.respond(HttpStatusCode.OK, arcs)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch arcs: ${e.message}"))
			}
		}

		// Get timeline (all events) for an arc (public)
		get("/{id}/timeline") {
			install(NotarizedRoute()) {
				tags = setOf("Arcs")
				get = GetInfo.builder {
					summary("Get arc timeline")
					description("Retrieve all events that occurred during a specific arc")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Arc ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Event>>()
						description("Timeline of events in the arc")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing arc ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing arc ID"))
				return@get
			}

			try {
				val events = eventRepository.findByArcId(id)
				call.respond(HttpStatusCode.OK, events)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch arc timeline: ${e.message}"))
			}
		}

		// Create arc (requires editor or admin)
		post {
			install(NotarizedRoute()) {
				tags = setOf("Arcs")
				post = PostInfo.builder {
					summary("Create new arc")
					description("Create a new story arc. Requires Editor or Admin role.")
					request {
						requestType<Arc>()
						description("Arc data")
					}
					response {
						responseCode(HttpStatusCode.Created)
						responseType<Arc>()
						description("Created arc with generated ID")
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
				val arc = call.receive<Arc>()
				val createdArc = arcRepository.create(arc, user.username)
				call.respond(HttpStatusCode.Created, createdArc)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to create arc: ${e.message}"))
			}
		}

		// Update arc (requires editor or admin)
		put("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Arcs")
				put = PutInfo.builder {
					summary("Update arc")
					description("Update an existing arc. Requires Editor or Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Arc ID"
						)
					)
					request {
						requestType<Arc>()
						description("Updated arc data")
					}
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Arc>()
						description("Updated arc")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Arc not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing arc ID")
					}
				}
			}

			val user = call.requireEditor(authMiddleware) ?: return@put

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing arc ID"))
				return@put
			}

			try {
				val arc = call.receive<Arc>()
				val updatedArc = arcRepository.update(id, arc, user.username)
				if (updatedArc == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Arc not found"))
				} else {
					call.respond(HttpStatusCode.OK, updatedArc)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update arc: ${e.message}"))
			}
		}

		// Delete arc (admin only)
		delete("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Arcs")
				delete = DeleteInfo.builder {
					summary("Delete arc")
					description("Delete an arc. Requires Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Arc ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Map<String, String>>()
						description("Arc deleted successfully")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Arc not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing arc ID")
					}
				}
			}

			val user = call.requireAdmin(authMiddleware) ?: return@delete

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing arc ID"))
				return@delete
			}

			try {
				val deleted = arcRepository.delete(id)
				if (deleted) {
					call.respond(HttpStatusCode.OK, mapOf("message" to "Arc deleted successfully"))
				} else {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Arc not found"))
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete arc: ${e.message}"))
			}
		}
	}
}
