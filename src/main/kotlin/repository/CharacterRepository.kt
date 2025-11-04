package com.repository

import com.config.DatabaseConfig
import com.model.Character
import com.util.DateCalculator
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Sorts
import com.mongodb.kotlin.client.coroutine.MongoCollection
import kotlinx.coroutines.flow.toList
import org.bson.types.ObjectId

class CharacterRepository(private val eventRepository: EventRepository) {
	private val database = DatabaseConfig.getDatabase()
	private val charactersCollection: MongoCollection<Character> = database.getCollection("characters")

	suspend fun findAll(): List<Character> {
		return charactersCollection.find()
			.sort(Sorts.ascending("name"))
			.toList()
	}

	suspend fun findById(id: String): Character? {
		val objectId = try {
			ObjectId(id)
		} catch (e: Exception) {
			return null
		}
		return charactersCollection.find(Filters.eq("_id", objectId)).toList().firstOrNull()
	}

	suspend fun findByName(name: String): Character? {
		return charactersCollection.find(Filters.eq("name", name)).toList().firstOrNull()
	}

	suspend fun searchByName(query: String): List<Character> {
		return charactersCollection.find(
			Filters.regex("name", query, "i")
		).toList()
	}

	suspend fun create(character: Character, username: String): Character {
		// Calculate birth and death dates before creating
		val characterWithDates = updateCharacterWithCalculatedDates(character)

		val timestamp = System.currentTimeMillis()
		val newCharacter = characterWithDates.copy(
			_id = ObjectId(),
			createdAt = timestamp,
			createdBy = username,
			updatedAt = timestamp,
			updatedBy = username
		)
		charactersCollection.insertOne(newCharacter)
		return newCharacter
	}

	suspend fun update(id: String, character: Character, username: String): Character? {
		val existingCharacter = findById(id) ?: return null

		// Recalculate birth and death dates before updating
		val characterWithDates = updateCharacterWithCalculatedDates(character)

		val updatedCharacter = characterWithDates.copy(
			_id = existingCharacter._id,
			createdAt = existingCharacter.createdAt,
			createdBy = existingCharacter.createdBy,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)

		charactersCollection.replaceOne(
			Filters.eq("_id", existingCharacter._id),
			updatedCharacter
		)

		return updatedCharacter
	}

	suspend fun delete(id: String): Boolean {
		val character = findById(id) ?: return false
		charactersCollection.deleteOne(Filters.eq("_id", character._id))
		return true
	}

	suspend fun findAliveAtDate(date: Int): List<Character> {
		return charactersCollection.find(
			Filters.and(
				// Character was born before or at this date (or birth date unknown)
				Filters.or(
					Filters.eq("calculatedBirthDate", null),
					Filters.lte("calculatedBirthDate", date.toDouble())
				),
				// Character died after this date or is still alive (or death date unknown)
				Filters.or(
					Filters.eq("calculatedDeathDate", null),
					Filters.gte("calculatedDeathDate", date.toDouble())
				)
			)
		).toList()
	}

	/**
	 * Calculate birth date for a character
	 * Returns the absolute date in days from year 0
	 */
	private suspend fun calculateBirthDate(character: Character): Double? {
		return when {
			// Exact birth date specified
			character.birthDate != null -> {
				DateCalculator.exactDateToDays(character.birthDate)
			}

			// Birth linked to an event
			character.birthEventId != null -> {
				val birthEvent = eventRepository.findById(character.birthEventId.toHexString())
					?: return null

				val eventAbsoluteDate = birthEvent.calculatedAbsoluteDate ?: return null

				// Apply offset if specified
				val offsetInDays = if (character.birthRelativeOffset != null && character.birthRelativeTimeUnit != null) {
					DateCalculator.timeUnitToDays(character.birthRelativeOffset, character.birthRelativeTimeUnit)
				} else {
					0.0
				}

				eventAbsoluteDate + offsetInDays
			}

			else -> null
		}
	}

	/**
	 * Calculate death date for a character
	 * Returns the absolute date in days from year 0
	 */
	private suspend fun calculateDeathDate(character: Character): Double? {
		return when {
			// Exact death date specified
			character.deathDate != null -> {
				DateCalculator.exactDateToDays(character.deathDate)
			}

			// Death linked to an event
			character.deathEventId != null -> {
				val deathEvent = eventRepository.findById(character.deathEventId.toHexString())
					?: return null

				val eventAbsoluteDate = deathEvent.calculatedAbsoluteDate ?: return null

				// Apply offset if specified
				val offsetInDays = if (character.deathRelativeOffset != null && character.deathRelativeTimeUnit != null) {
					DateCalculator.timeUnitToDays(character.deathRelativeOffset, character.deathRelativeTimeUnit)
				} else {
					0.0
				}

				eventAbsoluteDate + offsetInDays
			}

			else -> null
		}
	}

	/**
	 * Update a character with calculated dates
	 */
	private suspend fun updateCharacterWithCalculatedDates(character: Character): Character {
		val birthAbsoluteDate = calculateBirthDate(character)
		val deathAbsoluteDate = calculateDeathDate(character)

		val displayBirthYear = character.birthDate?.year ?: birthAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }
		val displayDeathYear = character.deathDate?.year ?: deathAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }

		return character.copy(
			calculatedBirthDate = birthAbsoluteDate,
			calculatedDeathDate = deathAbsoluteDate,
			displayBirthYear = displayBirthYear,
			displayDeathYear = displayDeathYear
		)
	}
}
