package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

enum class EventType {
	Birth, Death, Fight, Event, Meeting, Discovery
}

enum class DateType {
	Approximation, Exact, Relative
}

enum class TimeUnit {
	Minutes, Hours, Days, Weeks, Months, Years
}

enum class RelativeDirection {
	Before, After
}

@Serializable
data class ExactDate(
	val year: Int,
	val month: Int? = null,  // 1-12
	val day: Int? = null     // 1-31
)

@Serializable
data class Event(
	@Contextual
	val _id: ObjectId? = null,
	val name: String,
	val type: EventType,
	val description: String,
	@Contextual
	val arcId: ObjectId? = null,
	@Contextual
	val parentEventId: ObjectId? = null,  // Reference to parent event for hierarchical events
	@Contextual
	val locationId: ObjectId? = null,  // Reference to location where event occurred
	val dateType: DateType,

	// For Exact dates
	val exactDate: ExactDate? = null,

	// For Relative dates (relative to another event)
	@Contextual
	val relativeEventId: ObjectId? = null,  // Reference to another event
	val relativeOffset: Int? = null,         // How many units before/after (negative = before, positive = after). Null = vague offset
	val relativeTimeUnit: TimeUnit? = null,  // The unit of time (Hours, Days, Weeks, etc.)
	val relativeDirection: RelativeDirection? = null,  // Direction for vague dates (when offset is null). Defaults to After if not specified

	// For Approximation dates
	val approximateDescription: String? = null,  // e.g., "During the Summit War Arc"

	// Calculated absolute date (in days from year 0)
	// This is automatically calculated from relative dates or exact dates
	val calculatedAbsoluteDate: Double? = null,

	// Calculated exact date (year/month/day) for relative dates
	// This is the calculated full date for events with relative dates
	val calculatedExactDate: ExactDate? = null,

	// Display year for the frontend - calculated from absolute date or exact date
	val displayYear: Int? = null,

	val sources: List<Source> = emptyList(),
	val involvedCharacters: List<String> = emptyList(),

	// Character lifecycle tags - character IDs (as strings) born/died during this event
	val charactersBorn: List<String> = emptyList(),  // Characters born during this event
	val charactersDied: List<String> = emptyList(),  // Characters who died during this event

	val createdAt: Long = System.currentTimeMillis(),
	val createdBy: String? = null,
	val updatedAt: Long = System.currentTimeMillis(),
	val updatedBy: String? = null,
	val version: Int = 1,
	val isDeleted: Boolean = false
)
