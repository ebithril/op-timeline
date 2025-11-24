package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Event
import com.repository.EraRepository
import com.repository.EventRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.builtins.ListSerializer

fun Route.eventRoutes() {
	val eventRepository = EventRepository()
	val eraRepository = EraRepository(eventRepository)
	val authMiddleware = AuthMiddleware()

	route("/api/events") {
		// Get all events (public)
		get {
			try {
				val events = eventRepository.findAll()
				call.respond(HttpStatusCode.OK, events)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch events: ${e.message}"))
			}
		}

		// Get event by ID (public)
		get("/{id}") {
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
					// Recalculate any eras that depend on this event
					eraRepository.recalculateDependentErasForEvent(id, user.username)
					call.respond(HttpStatusCode.OK, updatedEvent)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update event: ${e.message}"))
			}
		}

		// Delete event (soft delete, admin only)
		delete("/{id}") {
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
			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing event ID"))
				return@get
			}

			try {
				val history = eventRepository.getVersionHistory(id)

				if (history.isEmpty()) {
					call.respond(HttpStatusCode.OK, emptyList<com.model.EventVersionResponse>())
					return@get
				}

				// Convert to response DTOs with readable change summaries
				val enhancedHistory = history.map { version ->
					val summary = if (version.version == 1) {
						"Initial creation"
					} else {
						util.PatchFormatter.createSummary(version.changedFields, version.changeDescription)
					}

					// Create detailed change descriptions from patches
					val changes = if (version.patches != null && version.patches.isNotEmpty()) {
						util.PatchFormatter.formatChanges(version.patches)
					} else {
						emptyList()
					}

					// Reconstruct the full event for this version (for frontend compatibility)
					val reconstructedEvent = if (version.versionType == "snapshot") {
						// For version 1, use the base snapshot
						version.baseSnapshot ?: version.event
					} else {
						// For diff versions, reconstruct from base + patches
						eventRepository.reconstructVersion(id, version.version)
					}

					com.model.EventVersionResponse(
						id = version._id?.toHexString() ?: "",
						eventId = version.eventId.toHexString(),
						version = version.version,
						versionType = version.versionType,
						changedBy = version.changedBy,
						changedAt = version.changedAt,
						changeDescription = version.changeDescription,
						changedFields = version.changedFields ?: emptyList(),
						summary = summary,
						changes = changes,
						patches = version.patches ?: emptyList(),
						event = reconstructedEvent  // Include full event for frontend
					)
				}

				call.respond(HttpStatusCode.OK, enhancedHistory)
			} catch (e: Exception) {
				e.printStackTrace()
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch history: ${e.message}"))
			}
		}

		// Get diff between two versions (public)
		get("/{id}/diff") {
			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing event ID"))
				return@get
			}

			val fromVersion = call.request.queryParameters["from"]?.toIntOrNull() ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing or invalid 'from' version parameter"))
				return@get
			}

			val toVersion = call.request.queryParameters["to"]?.toIntOrNull() ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing or invalid 'to' version parameter"))
				return@get
			}

			try {
				val fromEvent = eventRepository.reconstructVersion(id, fromVersion)
				val toEvent = eventRepository.reconstructVersion(id, toVersion)

				if (fromEvent == null || toEvent == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "One or both versions not found"))
					return@get
				}

				// Generate diff between the two versions
				val patches = util.EventDiffer.generateDiff(fromEvent, toEvent)
				val changedFields = util.EventDiffer.extractChangedFields(patches)

				val diffResponse = mapOf(
					"fromVersion" to fromVersion,
					"toVersion" to toVersion,
					"patches" to patches,
					"changedFields" to changedFields,
					"summary" to "Changed fields: ${changedFields.joinToString(", ")}"
				)

				call.respond(HttpStatusCode.OK, diffResponse)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to generate diff: ${e.message}"))
			}
		}

		// Revert to version (admin only)
		post("/{id}/revert/{version}") {
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
