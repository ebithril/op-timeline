package com.util

import com.model.Character
import com.model.ExactDate
import com.model.TimeUnit
import com.repository.EventRepository

object CharacterDateCalculator {
	private const val DAYS_PER_YEAR = 365.0
	private const val DAYS_PER_MONTH = 30.0

	/**
	 * Convert an ExactDate to absolute days from year 0
	 */
	private fun exactDateToDays(date: ExactDate): Double {
		var days = date.year * DAYS_PER_YEAR
		if (date.month != null) {
			days += (date.month - 1) * DAYS_PER_MONTH
		}
		if (date.day != null) {
			days += (date.day - 1)
		}
		return days
	}

	/**
	 * Calculate birth date for a character
	 * Returns the absolute date in days from year 0
	 */
	suspend fun calculateBirthDate(
		character: Character,
		eventRepository: EventRepository
	): Double? {
		return when {
			// Exact birth date specified
			character.birthDate != null -> {
				exactDateToDays(character.birthDate)
			}

			// Birth linked to an event
			character.birthEventId != null -> {
				val birthEvent = eventRepository.findById(character.birthEventId.toHexString())
					?: return null

				val eventAbsoluteDate = birthEvent.calculatedAbsoluteDate ?: return null

				// Apply offset if specified
				val offsetInDays = if (character.birthRelativeOffset != null && character.birthRelativeTimeUnit != null) {
					timeUnitToDays(character.birthRelativeOffset, character.birthRelativeTimeUnit)
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
	suspend fun calculateDeathDate(
		character: Character,
		eventRepository: EventRepository
	): Double? {
		return when {
			// Exact death date specified
			character.deathDate != null -> {
				exactDateToDays(character.deathDate)
			}

			// Death linked to an event
			character.deathEventId != null -> {
				val deathEvent = eventRepository.findById(character.deathEventId.toHexString())
					?: return null

				val eventAbsoluteDate = deathEvent.calculatedAbsoluteDate ?: return null

				// Apply offset if specified
				val offsetInDays = if (character.deathRelativeOffset != null && character.deathRelativeTimeUnit != null) {
					timeUnitToDays(character.deathRelativeOffset, character.deathRelativeTimeUnit)
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
	suspend fun updateCharacterWithCalculatedDates(
		character: Character,
		eventRepository: EventRepository
	): Character {
		val birthAbsoluteDate = calculateBirthDate(character, eventRepository)
		val deathAbsoluteDate = calculateDeathDate(character, eventRepository)

		val displayBirthYear = character.birthDate?.year ?: birthAbsoluteDate?.let { (it / DAYS_PER_YEAR).toInt() }
		val displayDeathYear = character.deathDate?.year ?: deathAbsoluteDate?.let { (it / DAYS_PER_YEAR).toInt() }

		return character.copy(
			calculatedBirthDate = birthAbsoluteDate,
			calculatedDeathDate = deathAbsoluteDate,
			displayBirthYear = displayBirthYear,
			displayDeathYear = displayDeathYear
		)
	}
}

/**
 * Convert TimeUnit to days - internal helper function
 */
private fun timeUnitToDays(amount: Int, unit: TimeUnit): Double {
	val DAYS_PER_WEEK = 7.0
	val DAYS_PER_MONTH = 30.0
	val DAYS_PER_YEAR = 365.0
	val HOURS_PER_DAY = 24.0
	val MINUTES_PER_HOUR = 60.0
	val MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR

	return when (unit) {
		TimeUnit.Minutes -> amount / MINUTES_PER_DAY
		TimeUnit.Hours -> amount / HOURS_PER_DAY
		TimeUnit.Days -> amount.toDouble()
		TimeUnit.Weeks -> amount * DAYS_PER_WEEK
		TimeUnit.Months -> amount * DAYS_PER_MONTH
		TimeUnit.Years -> amount * DAYS_PER_YEAR
	}
}
