package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Saga
import com.repository.ArcRepository
import com.repository.EventRepository
import com.repository.SagaRepository
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
			try {
				val sagas = sagaRepository.findAll()
				call.respond(HttpStatusCode.OK, sagas)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch sagas: ${e.message}"))
			}
		}

		// Get saga by ID (public)
		get("/{id}") {
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
