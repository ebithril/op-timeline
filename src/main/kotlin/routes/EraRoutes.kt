package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Era
import com.repository.EraRepository
import com.repository.EventRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.eraRoutes() {
	val eventRepository = EventRepository()
	val eraRepository = EraRepository(eventRepository)
	val authMiddleware = AuthMiddleware()

	route("/api/eras") {
		// Get all eras (public)
		get {
			try {
				val eras = eraRepository.findAll()
				call.respond(HttpStatusCode.OK, eras)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch eras: ${e.message}"))
			}
		}

		// Get era by ID (public)
		get("/{id}") {
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

				// Use calculated exact dates if available, otherwise use direct dates
				val startDate = era.startCalculatedExactDate ?: era.startDate
				val endDate = era.endCalculatedExactDate ?: era.endDate

				if (startDate == null || endDate == null) {
					call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Era dates could not be calculated"))
					return@get
				}

				val events = eventRepository.findByDateRange(startDate, endDate)
				call.respond(HttpStatusCode.OK, events)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch era timeline: ${e.message}"))
			}
		}

		// Create era (requires editor or admin)
		post {
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

		// Migrate old eras (admin only)
		post("/migrate") {
			val user = call.requireAdmin(authMiddleware) ?: return@post

			try {
				val count = eraRepository.migrateOldEras()
				call.respond(HttpStatusCode.OK, mapOf("message" to "Migrated $count eras", "count" to count))
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to migrate eras: ${e.message}"))
			}
		}
	}
}
