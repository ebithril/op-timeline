package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

@Serializable
data class Character(
	@Contextual
	val _id: ObjectId? = null,
	val name: String,
	val aliases: List<String> = emptyList(),

	// Birth date information
	val birthDate: ExactDate? = null,  // Exact birth date if known
	@Contextual
	val birthEventId: ObjectId? = null,  // Reference to birth event
	val birthRelativeOffset: Int? = null,  // Offset from birth event
	val birthRelativeTimeUnit: TimeUnit? = null,  // Time unit for offset
	val calculatedBirthDate: Double? = null,  // Absolute date in days
	val displayBirthYear: Int? = null,  // Calculated year for display

	// Death date information
	val deathDate: ExactDate? = null,  // Exact death date if known
	@Contextual
	val deathEventId: ObjectId? = null,  // Reference to death event
	val deathRelativeOffset: Int? = null,  // Offset from death event
	val deathRelativeTimeUnit: TimeUnit? = null,  // Time unit for offset
	val calculatedDeathDate: Double? = null,  // Absolute date in days
	val displayDeathYear: Int? = null,  // Calculated year for display

	val isAlive: Boolean = true,
	val description: String? = null,
	val affiliation: String? = null,
	val createdAt: Long = System.currentTimeMillis(),
	val createdBy: String? = null,
	val updatedAt: Long = System.currentTimeMillis(),
	val updatedBy: String? = null
)
