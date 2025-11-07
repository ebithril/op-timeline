package com.repository

import com.config.DatabaseConfig
import com.model.DateType
import com.model.Era
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Sorts
import com.mongodb.kotlin.client.coroutine.MongoCollection
import com.util.DateCalculator
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.toList
import org.bson.types.ObjectId

class EraRepository(private val eventRepository: EventRepository) {
	private val database = DatabaseConfig.getDatabase()
	private val erasCollection: MongoCollection<Era> = database.getCollection("eras")

	suspend fun findAll(): List<Era> {
		// Sort by calculated absolute date first, then by exact date fields as fallback
		return erasCollection.find()
			.sort(Sorts.ascending("startCalculatedAbsoluteDate", "startDate.year", "startDate.month", "startDate.day"))
			.toList()
	}

	suspend fun findById(id: String): Era? {
		val objectId = try {
			ObjectId(id)
		} catch (e: Exception) {
			return null
		}
		return erasCollection.find(Filters.eq("_id", objectId)).firstOrNull()
	}

	suspend fun create(era: Era, username: String): Era {
		val timestamp = System.currentTimeMillis()

		// Create era with generated ID first
		val eraWithId = era.copy(
			_id = ObjectId(),
			createdAt = timestamp,
			createdBy = username,
			updatedAt = timestamp,
			updatedBy = username
		)

		// Calculate dates for start
		val startAbsoluteDate = DateCalculator.calculateEraStartDate(eraWithId, this, eventRepository)
		val startCalculatedExactDate = DateCalculator.calculateEraStartExactDate(eraWithId, this, eventRepository)
		val startDisplayYear = when (eraWithId.startDateType) {
			DateType.Exact -> eraWithId.startDate?.year
			DateType.Relative -> startCalculatedExactDate?.year ?: startAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }
			DateType.Approximation -> null
		}

		// Calculate dates for end
		val endAbsoluteDate = DateCalculator.calculateEraEndDate(eraWithId, this, eventRepository)
		val endCalculatedExactDate = DateCalculator.calculateEraEndExactDate(eraWithId, this, eventRepository)
		val endDisplayYear = when (eraWithId.endDateType) {
			DateType.Exact -> eraWithId.endDate?.year
			DateType.Relative -> endCalculatedExactDate?.year ?: endAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }
			DateType.Approximation -> null
		}

		val newEra = eraWithId.copy(
			startCalculatedAbsoluteDate = startAbsoluteDate,
			startCalculatedExactDate = startCalculatedExactDate,
			startDisplayYear = startDisplayYear,
			endCalculatedAbsoluteDate = endAbsoluteDate,
			endCalculatedExactDate = endCalculatedExactDate,
			endDisplayYear = endDisplayYear
		)

		erasCollection.insertOne(newEra)
		return newEra
	}

	suspend fun update(id: String, era: Era, username: String): Era? {
		val existingEra = findById(id) ?: return null

		// Calculate dates for start
		val startAbsoluteDate = DateCalculator.calculateEraStartDate(era, this, eventRepository)
		val startCalculatedExactDate = DateCalculator.calculateEraStartExactDate(era, this, eventRepository)
		val startDisplayYear = when (era.startDateType) {
			DateType.Exact -> era.startDate?.year
			DateType.Relative -> startCalculatedExactDate?.year ?: startAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }
			DateType.Approximation -> null
		}

		// Calculate dates for end
		val endAbsoluteDate = DateCalculator.calculateEraEndDate(era, this, eventRepository)
		val endCalculatedExactDate = DateCalculator.calculateEraEndExactDate(era, this, eventRepository)
		val endDisplayYear = when (era.endDateType) {
			DateType.Exact -> era.endDate?.year
			DateType.Relative -> endCalculatedExactDate?.year ?: endAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }
			DateType.Approximation -> null
		}

		val updatedEra = era.copy(
			_id = existingEra._id,
			createdAt = existingEra.createdAt,
			createdBy = existingEra.createdBy,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username,
			startCalculatedAbsoluteDate = startAbsoluteDate,
			startCalculatedExactDate = startCalculatedExactDate,
			startDisplayYear = startDisplayYear,
			endCalculatedAbsoluteDate = endAbsoluteDate,
			endCalculatedExactDate = endCalculatedExactDate,
			endDisplayYear = endDisplayYear
		)

		erasCollection.replaceOne(
			Filters.eq("_id", existingEra._id),
			updatedEra
		)

		// Recalculate all eras that reference this era (cascade update)
		recalculateDependentEras(id, username)

		return updatedEra
	}

	/**
	 * Recursively recalculate dates for all eras that depend on the given era
	 */
	private suspend fun recalculateDependentEras(eraId: String, username: String) {
		// Find all eras that reference this era
		val dependentEras = findByRelativeEraId(eraId)

		for (dependent in dependentEras) {
			// Calculate dates for start
			val startAbsoluteDate = DateCalculator.calculateEraStartDate(dependent, this, eventRepository)
			val startCalculatedExactDate = DateCalculator.calculateEraStartExactDate(dependent, this, eventRepository)
			val startDisplayYear = when (dependent.startDateType) {
				DateType.Exact -> dependent.startDate?.year
				DateType.Relative -> startCalculatedExactDate?.year ?: startAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }
				DateType.Approximation -> null
			}

			// Calculate dates for end
			val endAbsoluteDate = DateCalculator.calculateEraEndDate(dependent, this, eventRepository)
			val endCalculatedExactDate = DateCalculator.calculateEraEndExactDate(dependent, this, eventRepository)
			val endDisplayYear = when (dependent.endDateType) {
				DateType.Exact -> dependent.endDate?.year
				DateType.Relative -> endCalculatedExactDate?.year ?: endAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }
				DateType.Approximation -> null
			}

			val updatedDependent = dependent.copy(
				startCalculatedAbsoluteDate = startAbsoluteDate,
				startCalculatedExactDate = startCalculatedExactDate,
				startDisplayYear = startDisplayYear,
				endCalculatedAbsoluteDate = endAbsoluteDate,
				endCalculatedExactDate = endCalculatedExactDate,
				endDisplayYear = endDisplayYear,
				updatedAt = System.currentTimeMillis(),
				updatedBy = username
			)

			erasCollection.replaceOne(
				Filters.eq("_id", dependent._id),
				updatedDependent
			)

			// Recursively update eras that depend on this era
			recalculateDependentEras(dependent._id!!.toHexString(), username)
		}
	}

	/**
	 * Find all eras that reference the given era
	 */
	suspend fun findByRelativeEraId(eraId: String): List<Era> {
		val objectId = ObjectId(eraId)
		val filter = Filters.or(
			Filters.eq("startRelativeEraId", objectId),
			Filters.eq("endRelativeEraId", objectId)
		)
		return erasCollection.find(filter).toList()
	}

	/**
	 * Find all eras that reference the given event
	 */
	suspend fun findByRelativeEventId(eventId: String): List<Era> {
		val objectId = ObjectId(eventId)
		val filter = Filters.or(
			Filters.eq("startRelativeEventId", objectId),
			Filters.eq("endRelativeEventId", objectId)
		)
		return erasCollection.find(filter).toList()
	}

	/**
	 * Recalculate dates for eras that depend on the given event
	 */
	suspend fun recalculateDependentErasForEvent(eventId: String, username: String) {
		// Find all eras that reference this event
		val dependentEras = findByRelativeEventId(eventId)

		for (dependent in dependentEras) {
			// Calculate dates for start
			val startAbsoluteDate = DateCalculator.calculateEraStartDate(dependent, this, eventRepository)
			val startCalculatedExactDate = DateCalculator.calculateEraStartExactDate(dependent, this, eventRepository)
			val startDisplayYear = when (dependent.startDateType) {
				DateType.Exact -> dependent.startDate?.year
				DateType.Relative -> startCalculatedExactDate?.year ?: startAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }
				DateType.Approximation -> null
			}

			// Calculate dates for end
			val endAbsoluteDate = DateCalculator.calculateEraEndDate(dependent, this, eventRepository)
			val endCalculatedExactDate = DateCalculator.calculateEraEndExactDate(dependent, this, eventRepository)
			val endDisplayYear = when (dependent.endDateType) {
				DateType.Exact -> dependent.endDate?.year
				DateType.Relative -> endCalculatedExactDate?.year ?: endAbsoluteDate?.let { (it / DateCalculator.DAYS_PER_YEAR).toInt() }
				DateType.Approximation -> null
			}

			val updatedDependent = dependent.copy(
				startCalculatedAbsoluteDate = startAbsoluteDate,
				startCalculatedExactDate = startCalculatedExactDate,
				startDisplayYear = startDisplayYear,
				endCalculatedAbsoluteDate = endAbsoluteDate,
				endCalculatedExactDate = endCalculatedExactDate,
				endDisplayYear = endDisplayYear,
				updatedAt = System.currentTimeMillis(),
				updatedBy = username
			)

			erasCollection.replaceOne(
				Filters.eq("_id", dependent._id),
				updatedDependent
			)

			// Recursively update eras that depend on this era
			recalculateDependentEras(dependent._id!!.toHexString(), username)
		}
	}

	suspend fun delete(id: String): Boolean {
		val era = findById(id) ?: return false
		erasCollection.deleteOne(Filters.eq("_id", era._id))
		return true
	}
}
