package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Location
import com.repository.EventRepository
import com.repository.LocationRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.locationRoutes() {
	val locationRepository = LocationRepository()
	val eventRepository = EventRepository()
	val authMiddleware = AuthMiddleware()

	route("/api/locations") {
		// Get all locations (public)
		get {
			try {
				val locations = locationRepository.findAll()
				call.respond(HttpStatusCode.OK, locations)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch locations: ${e.message}"))
			}
		}

		// Get location by ID (public)
		get("/{id}") {
			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing location ID"))
				return@get
			}

			try {
				val location = locationRepository.findById(id)
				if (location == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Location not found"))
				} else {
					call.respond(HttpStatusCode.OK, location)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch location: ${e.message}"))
			}
		}

		// Get location hierarchy (location + all parents) (public)
		get("/{id}/hierarchy") {
			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing location ID"))
				return@get
			}

			try {
				val hierarchy = locationRepository.getLocationHierarchy(id)
				call.respond(HttpStatusCode.OK, hierarchy)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch hierarchy: ${e.message}"))
			}
		}

		// Get child locations (public)
		get("/{id}/children") {
			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing location ID"))
				return@get
			}

			try {
				val children = locationRepository.findByParentId(id)
				call.respond(HttpStatusCode.OK, children)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch children: ${e.message}"))
			}
		}

		// Get all events at this location (public)
		get("/{id}/events") {
			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing location ID"))
				return@get
			}

			try {
				// Get all events where locationId matches
				val allEvents = eventRepository.findAll()
				val events = allEvents.filter { it.locationId?.toHexString() == id }

				// Sort by calculated date
				val sortedEvents = events.sortedWith(
					compareBy(
						{ it.calculatedAbsoluteDate },
						{ it.displayYear },
						{ it.createdAt }
					)
				)

				call.respond(HttpStatusCode.OK, sortedEvents)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch events: ${e.message}"))
			}
		}

		// Create location (requires editor or admin)
		post {
			val user = call.requireEditor(authMiddleware) ?: return@post

			try {
				val location = call.receive<Location>()
				val createdLocation = locationRepository.create(location, user.username)
				call.respond(HttpStatusCode.Created, createdLocation)
			} catch (e: IllegalArgumentException) {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message))
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to create location: ${e.message}"))
			}
		}

		// Update location (requires editor or admin)
		put("/{id}") {
			val user = call.requireEditor(authMiddleware) ?: return@put

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing location ID"))
				return@put
			}

			try {
				val location = call.receive<Location>()
				val updatedLocation = locationRepository.update(id, location, user.username)
				if (updatedLocation == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Location not found"))
				} else {
					call.respond(HttpStatusCode.OK, updatedLocation)
				}
			} catch (e: IllegalArgumentException) {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message))
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update location: ${e.message}"))
			}
		}

		// Delete location (admin only)
		delete("/{id}") {
			val user = call.requireAdmin(authMiddleware) ?: return@delete

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing location ID"))
				return@delete
			}

			try {
				val deleted = locationRepository.delete(id)
				if (deleted) {
					call.respond(HttpStatusCode.OK, mapOf("message" to "Location deleted successfully"))
				} else {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Location not found"))
				}
			} catch (e: IllegalArgumentException) {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message))
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete location: ${e.message}"))
			}
		}
	}
}
