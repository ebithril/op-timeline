package com.repository

import com.config.DatabaseConfig
import com.model.Event
import com.model.EventVersion
import com.util.DateCalculator
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Sorts
import com.mongodb.kotlin.client.coroutine.MongoCollection
import kotlinx.coroutines.flow.toList
import org.bson.types.ObjectId

class EventRepository {
	private val database = DatabaseConfig.getDatabase()
	private val eventsCollection: MongoCollection<Event> = database.getCollection("events")
	private val versionsCollection: MongoCollection<EventVersion> = database.getCollection("event_versions")

	suspend fun findAll(includeDeleted: Boolean = false): List<Event> {
		val filter = if (includeDeleted) {
			Filters.empty()
		} else {
			Filters.eq("isDeleted", false)
		}
		return eventsCollection.find(filter)
			.sort(Sorts.ascending("exactDate", "createdAt"))
			.toList()
	}

	suspend fun findById(id: String): Event? {
		val objectId = try {
			ObjectId(id)
		} catch (e: Exception) {
			return null
		}
		return eventsCollection.find(Filters.eq("_id", objectId)).toList().firstOrNull()
	}

	suspend fun findByCharacter(characterName: String): List<Event> {
		return eventsCollection.find(
			Filters.and(
				Filters.`in`("involvedCharacters", characterName),
				Filters.eq("isDeleted", false)
			)
		).toList()
	}

	suspend fun findByParentId(parentId: String): List<Event> {
		val objectId = try {
			ObjectId(parentId)
		} catch (e: Exception) {
			return emptyList()
		}
		return eventsCollection.find(
			Filters.and(
				Filters.eq("parentEventId", objectId),
				Filters.eq("isDeleted", false)
			)
		).sort(Sorts.ascending("calculatedAbsoluteDate", "displayYear", "createdAt"))
		.toList()
	}

	suspend fun findByArcId(arcId: String): List<Event> {
		val objectId = try {
			ObjectId(arcId)
		} catch (e: Exception) {
			return emptyList()
		}
		return eventsCollection.find(
			Filters.and(
				Filters.eq("arcId", objectId),
				Filters.eq("isDeleted", false)
			)
		).sort(Sorts.ascending("calculatedAbsoluteDate", "displayYear", "createdAt"))
		.toList()
	}

	suspend fun findByRelativeEventId(relativeEventId: String): List<Event> {
		val objectId = try {
			ObjectId(relativeEventId)
		} catch (e: Exception) {
			return emptyList()
		}
		return eventsCollection.find(
			Filters.and(
				Filters.eq("relativeEventId", objectId),
				Filters.eq("isDeleted", false)
			)
		).toList()
	}

	suspend fun findByDateRange(startDate: com.model.ExactDate, endDate: com.model.ExactDate): List<Event> {
		val startAbsoluteDate = DateCalculator.exactDateToDays(startDate)
		val endAbsoluteDate = DateCalculator.exactDateToDays(endDate)

		return eventsCollection.find(
			Filters.and(
				Filters.gte("calculatedAbsoluteDate", startAbsoluteDate),
				Filters.lte("calculatedAbsoluteDate", endAbsoluteDate),
				Filters.eq("isDeleted", false)
			)
		).sort(Sorts.ascending("calculatedAbsoluteDate", "displayYear", "createdAt"))
		.toList()
	}

	suspend fun create(event: Event, username: String): Event {
		// If has parent, inherit arcId from parent if not explicitly set
		val effectiveArcId = if (event.parentEventId != null && event.arcId == null) {
			val parent = findById(event.parentEventId.toHexString())
			parent?.arcId
		} else {
			event.arcId
		}

		// Calculate absolute date and exact date before creating
		val absoluteDate = DateCalculator.calculateAbsoluteDate(event, this)
		val calculatedExactDate = DateCalculator.calculateExactDate(event, this)
		val displayYear = event.exactDate?.year ?: calculatedExactDate?.year ?: absoluteDate?.let { (it / 365.0).toInt() }

		val timestamp = System.currentTimeMillis()
		val newEvent = event.copy(
			_id = ObjectId(),
			arcId = effectiveArcId,
			createdAt = timestamp,
			createdBy = username,
			updatedAt = timestamp,
			updatedBy = username,
			version = 1,
			calculatedAbsoluteDate = absoluteDate,
			calculatedExactDate = calculatedExactDate,
			displayYear = displayYear
		)
		eventsCollection.insertOne(newEvent)

		// Save initial version as base snapshot
		val version = EventVersion(
			eventId = newEvent._id!!,
			version = 1,
			versionType = "snapshot",
			baseSnapshot = newEvent,
			patches = null,
			changedFields = null,
			changedBy = username,
			changeDescription = "Initial creation"
		)
		versionsCollection.insertOne(version)

		return newEvent
	}

	suspend fun update(id: String, event: Event, username: String): Event? {
		val existingEvent = findById(id) ?: return null

		// If has parent, inherit arcId from parent if not explicitly set
		val effectiveArcId = if (event.parentEventId != null && event.arcId == null) {
			val parent = findById(event.parentEventId.toHexString())
			parent?.arcId
		} else {
			event.arcId
		}

		// Calculate absolute date and exact date before updating
		val absoluteDate = DateCalculator.calculateAbsoluteDate(event, this)
		val calculatedExactDate = DateCalculator.calculateExactDate(event, this)
		val displayYear = event.exactDate?.year ?: calculatedExactDate?.year ?: absoluteDate?.let { (it / 365.0).toInt() }

		val updatedEvent = event.copy(
			_id = existingEvent._id,
			arcId = effectiveArcId,
			createdAt = existingEvent.createdAt,
			createdBy = existingEvent.createdBy,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username,
			version = existingEvent.version + 1,
			calculatedAbsoluteDate = absoluteDate,
			calculatedExactDate = calculatedExactDate,
			displayYear = displayYear
		)

		eventsCollection.replaceOne(
			Filters.eq("_id", existingEvent._id),
			updatedEvent
		)

		// Generate diff from previous version and save as version history
		val patches = util.EventDiffer.generateDiff(existingEvent, updatedEvent)
		val changedFields = util.EventDiffer.extractChangedFields(patches)

		val version = EventVersion(
			eventId = existingEvent._id!!,
			version = updatedEvent.version,
			versionType = "diff",
			baseSnapshot = null,
			patches = patches,
			changedFields = changedFields,
			changedBy = username
		)
		versionsCollection.insertOne(version)

		// Recalculate all events that reference this event (cascade update)
		recalculateDependentEvents(id, username)

		return updatedEvent
	}

	/**
	 * Recursively recalculate dates for all events that depend on the given event
	 */
	private suspend fun recalculateDependentEvents(eventId: String, username: String) {
		// Find all events that reference this event
		val dependentEvents = findByRelativeEventId(eventId)

		for (dependent in dependentEvents) {
			// Recalculate dates for this dependent event
			val absoluteDate = DateCalculator.calculateAbsoluteDate(dependent, this)
			val calculatedExactDate = DateCalculator.calculateExactDate(dependent, this)
			val displayYear = dependent.exactDate?.year ?: calculatedExactDate?.year ?: absoluteDate?.let { (it / 365.0).toInt() }

			val updatedDependent = dependent.copy(
				calculatedAbsoluteDate = absoluteDate,
				calculatedExactDate = calculatedExactDate,
				displayYear = displayYear,
				updatedAt = System.currentTimeMillis(),
				updatedBy = username
			)

			eventsCollection.replaceOne(
				Filters.eq("_id", dependent._id),
				updatedDependent
			)

			// Recursively update events that depend on this event
			recalculateDependentEvents(dependent._id!!.toHexString(), username)
		}
	}

	suspend fun delete(id: String, username: String): Boolean {
		val event = findById(id) ?: return false

		val deletedEvent = event.copy(
			isDeleted = true,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username
		)

		eventsCollection.replaceOne(
			Filters.eq("_id", event._id),
			deletedEvent
		)

		return true
	}

	suspend fun getVersionHistory(eventId: String): List<EventVersion> {
		val objectId = try {
			ObjectId(eventId)
		} catch (e: Exception) {
			return emptyList()
		}

		return versionsCollection.find(Filters.eq("eventId", objectId))
			.sort(Sorts.descending("version"))
			.toList()
	}

	/**
	 * Reconstruct an Event at a specific version by applying all diffs from version 1
	 * Supports both old snapshot-based versions and new diff-based versions
	 *
	 * @param eventId The event ID
	 * @param versionNumber The target version number to reconstruct
	 * @return The reconstructed Event, or null if version not found
	 */
	suspend fun reconstructVersion(eventId: String, versionNumber: Int): Event? {
		val objectId = try {
			ObjectId(eventId)
		} catch (e: Exception) {
			return null
		}

		// Get all versions up to the target version, sorted ascending
		val versions = versionsCollection.find(
			Filters.and(
				Filters.eq("eventId", objectId),
				Filters.lte("version", versionNumber)
			)
		).sort(Sorts.ascending("version"))
		.toList()

		if (versions.isEmpty()) return null

		// Get version 1 (base snapshot)
		val baseVersion = versions.firstOrNull { it.version == 1 } ?: return null

		// For backward compatibility: if version has the old 'event' field, use it
		val baseEvent = baseVersion.baseSnapshot
			?: baseVersion.event
			?: return null

		// If requesting version 1, just return the base
		if (versionNumber == 1) {
			return baseEvent
		}

		// Collect all patches from versions 2 to target version
		val allPatches = versions
			.filter { it.version > 1 && it.version <= versionNumber }
			.flatMap { it.patches ?: emptyList() }

		// Reconstruct the event by applying all patches
		val reconstructed = util.EventReconstructor.reconstruct(baseEvent, allPatches)

		// Recalculate date fields (needed for relative dates that require repository access)
		val absoluteDate = DateCalculator.calculateAbsoluteDate(reconstructed, this)
		val calculatedExactDate = DateCalculator.calculateExactDate(reconstructed, this)
		val displayYear = reconstructed.exactDate?.year ?: calculatedExactDate?.year ?: absoluteDate?.let { (it / 365.0).toInt() }

		return reconstructed.copy(
			calculatedAbsoluteDate = absoluteDate,
			calculatedExactDate = calculatedExactDate,
			displayYear = displayYear
		)
	}

	suspend fun revertToVersion(eventId: String, versionNumber: Int, username: String): Event? {
		// Reconstruct the event at the target version
		val targetVersionEvent = reconstructVersion(eventId, versionNumber) ?: return null
		val currentEvent = findById(eventId) ?: return null

		// Recalculate dates for the reverted event
		val absoluteDate = DateCalculator.calculateAbsoluteDate(targetVersionEvent, this)
		val calculatedExactDate = DateCalculator.calculateExactDate(targetVersionEvent, this)
		val displayYear = targetVersionEvent.exactDate?.year ?: calculatedExactDate?.year ?: absoluteDate?.let { (it / 365.0).toInt() }

		val revertedEvent = targetVersionEvent.copy(
			_id = currentEvent._id,
			updatedAt = System.currentTimeMillis(),
			updatedBy = username,
			version = currentEvent.version + 1,
			calculatedAbsoluteDate = absoluteDate,
			calculatedExactDate = calculatedExactDate,
			displayYear = displayYear
		)

		eventsCollection.replaceOne(
			Filters.eq("_id", currentEvent._id),
			revertedEvent
		)

		// Generate diff from current to reverted state and save as new version
		val patches = util.EventDiffer.generateDiff(currentEvent, revertedEvent)
		val changedFields = util.EventDiffer.extractChangedFields(patches)

		val newVersion = EventVersion(
			eventId = currentEvent._id!!,
			version = revertedEvent.version,
			versionType = "diff",
			baseSnapshot = null,
			patches = patches,
			changedFields = changedFields,
			changedBy = username,
			changeDescription = "Reverted to version $versionNumber"
		)
		versionsCollection.insertOne(newVersion)

		// Recalculate all events that reference this event (cascade update)
		recalculateDependentEvents(eventId, username)

		return revertedEvent
	}
}
