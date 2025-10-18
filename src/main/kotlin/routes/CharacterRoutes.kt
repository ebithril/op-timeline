package com.routes

import com.middleware.AuthMiddleware
import com.middleware.requireAdmin
import com.middleware.requireEditor
import com.model.Character
import com.repository.CharacterRepository
import com.repository.EventRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.characterRoutes() {
	val eventRepository = EventRepository()
	val characterRepository = CharacterRepository(eventRepository)
	val authMiddleware = AuthMiddleware()

	route("/api/characters") {
		// Get all characters (public)
		get {
			try {
				val characters = characterRepository.findAll()
				call.respond(HttpStatusCode.OK, characters)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch characters: ${e.message}"))
			}
		}

		// Get character by ID (public)
		get("/{id}") {
			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing character ID"))
				return@get
			}

			try {
				val character = characterRepository.findById(id)
				if (character == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Character not found"))
				} else {
					call.respond(HttpStatusCode.OK, character)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch character: ${e.message}"))
			}
		}

		// Search characters by name (public)
		get("/search/{query}") {
			val query = call.parameters["query"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing search query"))
				return@get
			}

			try {
				val characters = characterRepository.searchByName(query)
				call.respond(HttpStatusCode.OK, characters)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to search characters: ${e.message}"))
			}
		}

		// Get characters alive at date (public)
		get("/alive-at/{date}") {
			val dateString = call.parameters["date"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing date"))
				return@get
			}

			try {
				// Parse date string in format "year-month-day" (e.g., "1522-2-10")
				val dateParts = dateString.split("-")
				if (dateParts.size != 3) {
					call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid date format. Expected: year-month-day"))
					return@get
				}

				val year = dateParts[0].toIntOrNull() ?: run {
					call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid year"))
					return@get
				}
				val month = dateParts[1].toIntOrNull() ?: run {
					call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid month"))
					return@get
				}
				val day = dateParts[2].toIntOrNull() ?: run {
					call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid day"))
					return@get
				}

				// Convert to days from year 0 for comparison
				val DAYS_PER_YEAR = 365.0
				val DAYS_PER_MONTH = 30.0
				val dateInDays = (year * DAYS_PER_YEAR + (month - 1) * DAYS_PER_MONTH + (day - 1)).toInt()

				val characters = characterRepository.findAliveAtDate(dateInDays)

				// Add age information to each character
				val charactersWithAge = characters.map { character ->
					val age = if (character.calculatedBirthDate != null) {
						val ageInDays = dateInDays - character.calculatedBirthDate
						val ageInYears = (ageInDays / DAYS_PER_YEAR).toInt()
						if (ageInYears >= 0) ageInYears else null
					} else {
						null
					}

					mapOf(
						"_id" to character._id?.toHexString(),
						"name" to character.name,
						"age" to age,
						"birthDate" to character.birthDate,
						"displayBirthYear" to character.displayBirthYear
					)
				}

				call.respond(HttpStatusCode.OK, charactersWithAge)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch characters: ${e.message}"))
			}
		}

		// Create character (requires editor or admin)
		post {
			val user = call.requireEditor(authMiddleware) ?: return@post

			try {
				val character = call.receive<Character>()
				val createdCharacter = characterRepository.create(character, user.username)
				call.respond(HttpStatusCode.Created, createdCharacter)
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to create character: ${e.message}"))
			}
		}

		// Update character (requires editor or admin)
		put("/{id}") {
			val user = call.requireEditor(authMiddleware) ?: return@put

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing character ID"))
				return@put
			}

			try {
				val character = call.receive<Character>()
				val updatedCharacter = characterRepository.update(id, character, user.username)
				if (updatedCharacter == null) {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Character not found"))
				} else {
					call.respond(HttpStatusCode.OK, updatedCharacter)
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update character: ${e.message}"))
			}
		}

		// Delete character (admin only)
		delete("/{id}") {
			val user = call.requireAdmin(authMiddleware) ?: return@delete

			val id = call.parameters["id"] ?: run {
				call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing character ID"))
				return@delete
			}

			try {
				val deleted = characterRepository.delete(id)
				if (deleted) {
					call.respond(HttpStatusCode.OK, mapOf("message" to "Character deleted successfully"))
				} else {
					call.respond(HttpStatusCode.NotFound, mapOf("error" to "Character not found"))
				}
			} catch (e: Exception) {
				call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete character: ${e.message}"))
			}
		}
	}
}
