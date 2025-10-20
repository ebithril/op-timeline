package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Arc
import com.repository.ArcRepository
import com.repository.EventRepository
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
			try {
				val arcs = arcRepository.findAll()
				call.respond(HttpStatusCode.OK, arcs)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch arcs: ${e.message}"))
			}
		}

		// Get arc by ID (public)
		get("/{id}") {
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
