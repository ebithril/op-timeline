package com.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

@Serializable
data class Era(
	@Contextual
	val _id: ObjectId? = null,
	val name: String,
	val description: String? = null,

	// Start date configuration
	val startDateType: DateType = DateType.Exact,

	// For Exact start dates
	val startDate: ExactDate? = null,

	// For Relative start dates (relative to another era or event)
	@Contextual
	val startRelativeEraId: ObjectId? = null,  // Reference to another era
	@Contextual
	val startRelativeEventId: ObjectId? = null,  // Reference to an event
	val startRelativeOffset: Int? = null,  // How many units before/after (negative = before, positive = after). Null = vague offset
	val startRelativeTimeUnit: TimeUnit? = null,  // The unit of time (Hours, Days, Weeks, etc.)
	val startRelativeDirection: RelativeDirection? = null,  // Direction for vague dates (when offset is null)

	// For Approximation start dates
	val startApproximateDescription: String? = null,

	// Calculated start date fields
	val startCalculatedAbsoluteDate: Double? = null,  // In days from year 0
	val startCalculatedExactDate: ExactDate? = null,  // Calculated full date for relative dates
	val startDisplayYear: Int? = null,  // Display year for frontend

	// End date configuration
	val endDateType: DateType = DateType.Exact,

	// For Exact end dates
	val endDate: ExactDate? = null,

	// For Relative end dates (relative to another era or event)
	@Contextual
	val endRelativeEraId: ObjectId? = null,  // Reference to another era
	@Contextual
	val endRelativeEventId: ObjectId? = null,  // Reference to an event
	val endRelativeOffset: Int? = null,  // How many units before/after (negative = before, positive = after). Null = vague offset
	val endRelativeTimeUnit: TimeUnit? = null,  // The unit of time (Hours, Days, Weeks, etc.)
	val endRelativeDirection: RelativeDirection? = null,  // Direction for vague dates (when offset is null)

	// For Approximation end dates
	val endApproximateDescription: String? = null,

	// Calculated end date fields
	val endCalculatedAbsoluteDate: Double? = null,  // In days from year 0
	val endCalculatedExactDate: ExactDate? = null,  // Calculated full date for relative dates
	val endDisplayYear: Int? = null,  // Display year for frontend

	val createdAt: Long = System.currentTimeMillis(),
	val createdBy: String? = null,
	val updatedAt: Long = System.currentTimeMillis(),
	val updatedBy: String? = null
)
