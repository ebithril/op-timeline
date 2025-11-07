package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Event
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
import kotlin.reflect.typeOf

fun Route.eventRoutes() {
	val eventRepository = EventRepository()
	val authMiddleware = AuthMiddleware()

	route("/api/events") {
		// Get all events (public)
		get {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				get = GetInfo.builder {
					summary("Get all events")
					description("Retrieve all timeline events, including births, deaths, fights, and other events")
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Event>>()
						description("List of all events")
					}
					canRespond {
						responseCode(HttpStatusCode.InternalServerError)
						responseType<Map<String, String>>()
						description("Internal server error")
					}
				}
			}

			try {
				val events = eventRepository.findAll()
				call.respond(HttpStatusCode.OK, events)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch events: ${e.message}"))
			}
		}

		// Get event by ID (public)
		get("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				get = GetInfo.builder {
					summary("Get event by ID")
					description("Retrieve a specific event by its unique identifier")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Event ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Event>()
						description("Event details")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Event not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing or invalid event ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing event ID"))
				return@get
			}

			try {
				val event = eventRepository.findById(id)
				if (event == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Event not found"))
				} else {
					call.respond(HttpStatusCode.OK, event)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch event: ${e.message}"))
			}
		}

		// Get events by character (public)
		get("/character/{name}") {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				get = GetInfo.builder {
					summary("Get events by character")
					description("Retrieve all events involving a specific character")
					parameters = listOf(
						Parameter(
							name = "name",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Character name"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Event>>()
						description("List of events involving the character")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing character name")
					}
				}
			}

			val name = call.parameters["name"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing character name"))
				return@get
			}

			try {
				val events = eventRepository.findByCharacter(name)
				call.respond(HttpStatusCode.OK, events)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch events: ${e.message}"))
			}
		}

		// Get child events of a parent event (public)
		get("/{id}/children") {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				get = GetInfo.builder {
					summary("Get child events")
					description("Retrieve all child events of a parent event (hierarchical events)")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Parent event ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Event>>()
						description("List of child events")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing event ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing event ID"))
				return@get
			}

			try {
				val children = eventRepository.findByParentId(id)
				call.respond(HttpStatusCode.OK, children)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch child events: ${e.message}"))
			}
		}

		// Get timeline (child events) for a parent event (public)
		get("/{id}/timeline") {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				get = GetInfo.builder {
					summary("Get event timeline")
					description("Retrieve the timeline (all child events) for a parent event")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Parent event ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Event>>()
						description("Timeline of child events")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing event ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing event ID"))
				return@get
			}

			try {
				val children = eventRepository.findByParentId(id)
				call.respond(HttpStatusCode.OK, children)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch timeline: ${e.message}"))
			}
		}

		// Create new event (requires editor or admin)
		post {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				post = PostInfo.builder {
					summary("Create new event")
					description("Create a new timeline event. Requires Editor or Admin role. At least one source is required.")
					request {
						requestType<Event>()
						description("Event data")
					}
					response {
						responseCode(HttpStatusCode.Created)
						responseType<Event>()
						description("Created event with generated ID and calculated dates")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing required fields or validation error")
					}
				}
			}

			val user = call.requireEditor(authMiddleware) ?: return@post

			try {
				val event = call.receive<Event>()
				if (event.sources.isEmpty()) {
					call.respond(HttpStatusCode.BadRequest, mapOf("error" to "At least one source is required"))
					return@post
				}

				val createdEvent = eventRepository.create(event, user.username)
				call.respond(HttpStatusCode.Created, createdEvent)
			} catch (e: Exception) {
				e.printStackTrace()
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to create event: ${e.message}", "details" to "${e::class.simpleName}: ${e.stackTraceToString().take(500)}"))
			}
		}

		// Update event (requires editor or admin)
		put("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				put = PutInfo.builder {
					summary("Update event")
					description("Update an existing event. Requires Editor or Admin role. Creates a new version in history.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Event ID"
						)
					)
					request {
						requestType<Event>()
						description("Updated event data")
					}
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Event>()
						description("Updated event")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Event not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing required fields or validation error")
					}
				}
			}

			val user = call.requireEditor(authMiddleware) ?: return@put

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing event ID"))
				return@put
			}

			try {
				val event = call.receive<Event>()
				if (event.sources.isEmpty()) {
					call.respond(HttpStatusCode.BadRequest, mapOf("error" to "At least one source is required"))
					return@put
				}

				val updatedEvent = eventRepository.update(id, event, user.username)
				if (updatedEvent == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Event not found"))
				} else {
					call.respond(HttpStatusCode.OK, updatedEvent)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update event: ${e.message}"))
			}
		}

		// Delete event (soft delete, admin only)
		delete("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				delete = DeleteInfo.builder {
					summary("Delete event")
					description("Soft delete an event (marks as deleted). Requires Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Event ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Map<String, String>>()
						description("Event deleted successfully")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Event not found")
					}
				}
			}

			val user = call.requireAdmin(authMiddleware) ?: return@delete

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing event ID"))
				return@delete
			}

			try {
				val deleted = eventRepository.delete(id, user.username)
				if (deleted) {
					call.respond(HttpStatusCode.OK, mapOf("message" to "Event deleted successfully"))
				} else {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Event not found"))
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete event: ${e.message}"))
			}
		}

		// Get version history (public)
		get("/{id}/history") {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				get = GetInfo.builder {
					summary("Get event version history")
					description("Retrieve the complete version history for an event, showing all changes over time")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Event ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType(typeOf<List<Event>>())
						description("List of event versions, ordered by version number")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing event ID")
					}
				}
			}

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing event ID"))
				return@get
			}

			try {
				val history = eventRepository.getVersionHistory(id)
				call.respond(HttpStatusCode.OK, history)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch history: ${e.message}"))
			}
		}

		// Revert to version (admin only)
		post("/{id}/revert/{version}") {
			install(NotarizedRoute()) {
				tags = setOf("Events")
				post = PostInfo.builder {
					summary("Revert event to previous version")
					description("Revert an event to a specific version from its history. Requires Admin role. This creates a new version with the old content.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Event ID"
						),
						Parameter(
							name = "version",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.INT,
							description = "Version number to revert to"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Event>()
						description("Reverted event (new version created)")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Event or version not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Invalid version number")
					}
				}
			}

			val user = call.requireAdmin(authMiddleware) ?: return@post

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing event ID"))
				return@post
			}

			val versionNumber = call.parameters["version"]?.toIntOrNull() ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid version number"))
				return@post
			}

			try {
				val revertedEvent = eventRepository.revertToVersion(id, versionNumber, user.username)
				if (revertedEvent == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Event or version not found"))
				} else {
					call.respond(HttpStatusCode.OK, revertedEvent)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to revert event: ${e.message}"))
			}
		}
	}
}
