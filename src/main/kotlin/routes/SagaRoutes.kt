package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Event
import com.model.Saga
import com.repository.ArcRepository
import com.repository.EventRepository
import com.repository.SagaRepository
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

fun Route.sagaRoutes() {
	val sagaRepository = SagaRepository()
	val arcRepository = ArcRepository()
	val eventRepository = EventRepository()
	val authMiddleware = AuthMiddleware()

	route("/api/sagas") {
		// Get all sagas (public)
		get {
			install(NotarizedRoute()) {
				tags = setOf("Sagas")
				get = GetInfo.builder {
					summary("Get all sagas")
					description("Retrieve all sagas in the One Piece timeline")
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Saga>>()
						description("List of all sagas")
					}
					canRespond {
						responseCode(HttpStatusCode.InternalServerError)
						responseType<Map<String, String>>()
						description("Internal server error")
					}
				}
			}

			try {
				val sagas = sagaRepository.findAll()
				call.respond(HttpStatusCode.OK, sagas)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch sagas: ${e.message}"))
			}
		}

		// Get saga by ID (public)
		get("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Sagas")
				get = GetInfo.builder {
					summary("Get saga by ID")
					description("Retrieve a specific saga by its unique identifier")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Saga ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Saga>()
						description("Saga details")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Saga not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing saga ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing saga ID"))
				return@get
			}

			try {
				val saga = sagaRepository.findById(id)
				if (saga == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Saga not found"))
				} else {
					call.respond(HttpStatusCode.OK, saga)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch saga: ${e.message}"))
			}
		}

		// Get timeline (all events in all arcs) for a saga (public)
		get("/{id}/timeline") {
			install(NotarizedRoute()) {
				tags = setOf("Sagas")
				get = GetInfo.builder {
					summary("Get saga timeline")
					description("Retrieve all events from all arcs in a saga, sorted chronologically")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Saga ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Event>>()
						description("Timeline of all events in the saga")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing saga ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing saga ID"))
				return@get
			}

			try {
				// Get all arcs in this saga
				val arcs = arcRepository.findBySagaId(id)

				// Get all events for each arc and flatten into single list
				val allEvents = arcs.flatMap { arc ->
					eventRepository.findByArcId(arc._id!!.toHexString())
				}

				// Sort by calculated date
				val sortedEvents = allEvents.sortedWith(
					compareBy(
						{ it.calculatedAbsoluteDate },
						{ it.displayYear },
						{ it.createdAt }
					)
				)

				call.respond(HttpStatusCode.OK, sortedEvents)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch saga timeline: ${e.message}"))
			}
		}

		// Create saga (requires editor or admin)
		post {
			install(NotarizedRoute()) {
				tags = setOf("Sagas")
				post = PostInfo.builder {
					summary("Create new saga")
					description("Create a new saga. Requires Editor or Admin role.")
					request {
						requestType<Saga>()
						description("Saga data")
					}
					response {
						responseCode(HttpStatusCode.Created)
						responseType<Saga>()
						description("Created saga with generated ID")
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
				val saga = call.receive<Saga>()
				val createdSaga = sagaRepository.create(saga, user.username)
				call.respond(HttpStatusCode.Created, createdSaga)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to create saga: ${e.message}"))
			}
		}

		// Update saga (requires editor or admin)
		put("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Sagas")
				put = PutInfo.builder {
					summary("Update saga")
					description("Update an existing saga. Requires Editor or Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Saga ID"
						)
					)
					request {
						requestType<Saga>()
						description("Updated saga data")
					}
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Saga>()
						description("Updated saga")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Saga not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing saga ID")
					}
				}
			}

			val user = call.requireEditor(authMiddleware) ?: return@put

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing saga ID"))
				return@put
			}

			try {
				val saga = call.receive<Saga>()
				val updatedSaga = sagaRepository.update(id, saga, user.username)
				if (updatedSaga == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Saga not found"))
				} else {
					call.respond(HttpStatusCode.OK, updatedSaga)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update saga: ${e.message}"))
			}
		}

		// Delete saga (admin only)
		delete("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Sagas")
				delete = DeleteInfo.builder {
					summary("Delete saga")
					description("Delete a saga. Requires Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Saga ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Map<String, String>>()
						description("Saga deleted successfully")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Saga not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing saga ID")
					}
				}
			}

			val user = call.requireAdmin(authMiddleware) ?: return@delete

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing saga ID"))
				return@delete
			}

			try {
				val deleted = sagaRepository.delete(id)
				if (deleted) {
					call.respond(HttpStatusCode.OK, mapOf("message" to "Saga deleted successfully"))
				} else {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Saga not found"))
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete saga: ${e.message}"))
			}
		}
	}
}
