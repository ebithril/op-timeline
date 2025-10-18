package com.repository

import com.config.DatabaseConfig
import com.model.Character
import com.util.CharacterDateCalculator
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
		val characterWithDates = CharacterDateCalculator.updateCharacterWithCalculatedDates(
			character,
			eventRepository
		)

		val newCharacter = characterWithDates.copy(
			createdAt = System.currentTimeMillis(),
			createdBy = username,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)
		charactersCollection.insertOne(newCharacter)
		return newCharacter
	}

	suspend fun update(id: String, character: Character, username: String): Character? {
		val existingCharacter = findById(id) ?: return null

		// Recalculate birth and death dates before updating
		val characterWithDates = CharacterDateCalculator.updateCharacterWithCalculatedDates(
			character,
			eventRepository
		)

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
}
