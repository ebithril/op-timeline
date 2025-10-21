package com.util

import com.model.Event
import com.model.ExactDate
import com.model.RelativeDirection
import com.model.TimeUnit
import com.repository.EventRepository

object DateCalculator {
	private const val DAYS_PER_YEAR = 365.0
	private const val DAYS_PER_MONTH = 30.0
	private const val DAYS_PER_WEEK = 7.0
	private const val HOURS_PER_DAY = 24.0
	private const val MINUTES_PER_HOUR = 60.0
	private const val MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR

	// Reference years for One Piece timeline (Kaienreki / Sea Circle Calendar)
	const val SERIES_START_YEAR = 1522  // Romance Dawn arc begins
	const val TIMESKIP_END_YEAR = 1524  // Return to Sabaody after 2-year timeskip

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
	 * Convert absolute days from year 0 to an ExactDate object
	 */
	private fun daysToExactDate(totalDays: Double): ExactDate {
		val year = (totalDays / DAYS_PER_YEAR).toInt()
		val remainingDaysAfterYears = totalDays - (year * DAYS_PER_YEAR)

		val month = ((remainingDaysAfterYears / DAYS_PER_MONTH).toInt() + 1).coerceIn(1, 12)
		val remainingDaysAfterMonths = remainingDaysAfterYears - ((month - 1) * DAYS_PER_MONTH)

		val day = (remainingDaysAfterMonths.toInt() + 1).coerceIn(1, 31)

		return ExactDate(year = year, month = month, day = day)
	}

	/**
	 * Convert TimeUnit to days
	 */
	private fun timeUnitToDays(amount: Int, unit: TimeUnit): Double {
		return when (unit) {
			TimeUnit.Minutes -> amount / MINUTES_PER_DAY
			TimeUnit.Hours -> amount / HOURS_PER_DAY
			TimeUnit.Days -> amount.toDouble()
			TimeUnit.Weeks -> amount * DAYS_PER_WEEK
			TimeUnit.Months -> amount * DAYS_PER_MONTH
			TimeUnit.Years -> amount * DAYS_PER_YEAR
		}
	}

	/**
	 * Get midpoint estimate for vague relative dates (when offset is null)
	 * Returns a reasonable midpoint value for each time unit
	 * Positive values indicate "after", negative values indicate "before"
	 */
	private fun getVagueOffsetMidpoint(unit: TimeUnit, direction: RelativeDirection?): Double {
		val midpoint = when (unit) {
			TimeUnit.Minutes -> 30.0 / MINUTES_PER_DAY  // ~30 minutes
			TimeUnit.Hours -> 12.0 / HOURS_PER_DAY      // ~12 hours
			TimeUnit.Days -> 3.5                         // ~3.5 days
			TimeUnit.Weeks -> 2.5 * DAYS_PER_WEEK       // ~2.5 weeks
			TimeUnit.Months -> 6.0 * DAYS_PER_MONTH     // ~6 months
			TimeUnit.Years -> 5.0 * DAYS_PER_YEAR       // ~5 years
		}
		// Default to After if direction is not specified
		return if (direction == RelativeDirection.Before) -midpoint else midpoint
	}

	/**
	 * Calculate the absolute date for an event (in days from year 0)
	 * Returns null if the date cannot be calculated (e.g., circular dependencies)
	 */
	suspend fun calculateAbsoluteDate(
		event: Event,
		eventRepository: EventRepository,
		visited: MutableSet<String> = mutableSetOf()
	): Double? {
		// Prevent infinite loops from circular references
		if (event._id != null) {
			val eventId = event._id.toHexString()
			if (eventId in visited) {
				return null // Circular dependency detected
			}
			visited.add(eventId)
		}

		return when {
			// Exact date: convert to days
			event.exactDate != null -> {
				exactDateToDays(event.exactDate)
			}

			// Relative date: calculate based on referenced event
			event.relativeEventId != null && event.relativeTimeUnit != null -> {
				val referencedEvent = eventRepository.findById(event.relativeEventId.toHexString())
					?: return null

				val referencedAbsoluteDate = calculateAbsoluteDate(referencedEvent, eventRepository, visited)
					?: return null

				// If offset is specified, use it; otherwise use midpoint estimate for vague relative
				val offsetInDays = if (event.relativeOffset != null) {
					timeUnitToDays(event.relativeOffset, event.relativeTimeUnit)
				} else {
					// Vague relative date - use midpoint estimate with direction
					getVagueOffsetMidpoint(event.relativeTimeUnit, event.relativeDirection)
				}
				referencedAbsoluteDate + offsetInDays
			}

			// Approximation or unknown: cannot calculate
			else -> null
		}
	}

	/**
	 * Calculate the exact date (year/month/day) for an event with relative dates
	 * Returns null if the date cannot be calculated
	 */
	suspend fun calculateExactDate(
		event: Event,
		eventRepository: EventRepository
	): ExactDate? {
		// If event already has an exact date, return it
		if (event.exactDate != null) {
			return event.exactDate
		}

		// For relative dates, calculate the absolute date and convert back to ExactDate
		if (event.relativeEventId != null && event.relativeTimeUnit != null) {
			val absoluteDate = calculateAbsoluteDate(event, eventRepository) ?: return null
			return daysToExactDate(absoluteDate)
		}

		// Cannot calculate for approximations
		return null
	}

	/**
	 * Update an event with its calculated absolute date
	 */
	suspend fun updateEventWithAbsoluteDate(
		event: Event,
		eventRepository: EventRepository
	): Event {
		val absoluteDate = calculateAbsoluteDate(event, eventRepository)
		return event.copy(calculatedAbsoluteDate = absoluteDate)
	}
}
