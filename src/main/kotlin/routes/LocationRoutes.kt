package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Event
import com.model.Location
import com.repository.EventRepository
import com.repository.LocationRepository
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

fun Route.locationRoutes() {
	val locationRepository = LocationRepository()
	val eventRepository = EventRepository()
	val authMiddleware = AuthMiddleware()

	route("/api/locations") {
		// Get all locations (public)
		get {
			install(NotarizedRoute()) {
				tags = setOf("Locations")
				get = GetInfo.builder {
					summary("Get all locations")
					description("Retrieve all locations in the One Piece world")
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Location>>()
						description("List of all locations")
					}
					canRespond {
						responseCode(HttpStatusCode.InternalServerError)
						responseType<Map<String, String>>()
						description("Internal server error")
					}
				}
			}

			try {
				val locations = locationRepository.findAll()
				call.respond(HttpStatusCode.OK, locations)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch locations: ${e.message}"))
			}
		}

		// Get location by ID (public)
		get("/{id}") {
			install(NotarizedRoute()) {
				tags = setOf("Locations")
				get = GetInfo.builder {
					summary("Get location by ID")
					description("Retrieve a specific location by its unique identifier")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Location ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Location>()
						description("Location details")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Location not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing location ID")
					}
				}
			}

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
			install(NotarizedRoute()) {
				tags = setOf("Locations")
				get = GetInfo.builder {
					summary("Get location hierarchy")
					description("Retrieve the full hierarchy chain for a location (location + all parent locations)")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Location ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Location>>()
						description("Hierarchy of locations from root to specified location")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing location ID")
					}
				}
			}

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
			install(NotarizedRoute()) {
				tags = setOf("Locations")
				get = GetInfo.builder {
					summary("Get child locations")
					description("Retrieve all direct child locations of a parent location")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Parent location ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Location>>()
						description("List of child locations")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing location ID")
					}
				}
			}

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
			install(NotarizedRoute()) {
				tags = setOf("Locations")
				get = GetInfo.builder {
					summary("Get events at location")
					description("Retrieve all events that occurred at a specific location, sorted chronologically")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Location ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<List<Event>>()
						description("List of events at this location")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Missing location ID")
					}
				}
			}

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
			install(NotarizedRoute()) {
				tags = setOf("Locations")
				post = PostInfo.builder {
					summary("Create new location")
					description("Create a new location. Requires Editor or Admin role.")
					request {
						requestType<Location>()
						description("Location data")
					}
					response {
						responseCode(HttpStatusCode.Created)
						responseType<Location>()
						description("Created location with generated ID")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Validation error (e.g., circular parent reference)")
					}
				}
			}

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
			install(NotarizedRoute()) {
				tags = setOf("Locations")
				put = PutInfo.builder {
					summary("Update location")
					description("Update an existing location. Requires Editor or Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Location ID"
						)
					)
					request {
						requestType<Location>()
						description("Updated location data")
					}
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Location>()
						description("Updated location")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Location not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Validation error (e.g., missing ID, circular parent reference)")
					}
				}
			}

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
			install(NotarizedRoute()) {
				tags = setOf("Locations")
				delete = DeleteInfo.builder {
					summary("Delete location")
					description("Delete a location. Requires Admin role.")
					parameters = listOf(
						Parameter(
							name = "id",
							`in` = Parameter.Location.path,
							schema = TypeDefinition.STRING,
							description = "Location ID"
						)
					)
					response {
						responseCode(HttpStatusCode.OK)
						responseType<Map<String, String>>()
						description("Location deleted successfully")
					}
					canRespond {
						responseCode(HttpStatusCode.Unauthorized)
						responseType<Map<String, String>>()
						description("Not authenticated or insufficient permissions")
					}
					canRespond {
						responseCode(HttpStatusCode.NotFound)
						responseType<Map<String, String>>()
						description("Location not found")
					}
					canRespond {
						responseCode(HttpStatusCode.BadRequest)
						responseType<Map<String, String>>()
						description("Validation error (e.g., missing ID, location has children)")
					}
				}
			}

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
