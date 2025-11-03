package helpers

import com.model.*
import org.bson.types.ObjectId

/**
 * Test data builders for creating test fixtures
 */
object TestData {
    fun createEvent(
        id: String = ObjectId().toHexString(),
        name: String = "Test Event",
        type: EventType = EventType.Event,
        description: String = "Test description",
        dateType: DateType = DateType.Exact,
        exactDate: ExactDate? = ExactDate(year = 1500, month = 1, day = 1),
        relativeEventId: ObjectId? = null,
        relativeOffset: Int? = null,
        relativeTimeUnit: TimeUnit? = null,
        relativeDirection: RelativeDirection? = null,
        approximateDescription: String? = null,
        calculatedAbsoluteDate: Double? = null,
        calculatedExactDate: ExactDate? = null,
        displayYear: Int? = exactDate?.year,
        arcId: ObjectId? = null,
        parentEventId: ObjectId? = null,
        locationId: ObjectId? = null,
        involvedCharacters: List<String> = listOf(),
        sources: List<Source> = listOf(Source(sourceType = SourceType.Chapter, notes = "Test", isPrimary = true)),
        createdBy: String? = "testuser",
        createdAt: Long = System.currentTimeMillis(),
        version: Int = 1
    ) = Event(
        _id = ObjectId(id),
        name = name,
        type = type,
        description = description,
        dateType = dateType,
        exactDate = exactDate,
        relativeEventId = relativeEventId,
        relativeOffset = relativeOffset,
        relativeTimeUnit = relativeTimeUnit,
        relativeDirection = relativeDirection,
        approximateDescription = approximateDescription,
        calculatedAbsoluteDate = calculatedAbsoluteDate,
        calculatedExactDate = calculatedExactDate,
        displayYear = displayYear,
        arcId = arcId,
        parentEventId = parentEventId,
        locationId = locationId,
        involvedCharacters = involvedCharacters,
        sources = sources,
        createdBy = createdBy,
        createdAt = createdAt,
        version = version
    )

    fun createCharacter(
        id: String = ObjectId().toHexString(),
        name: String = "Test Character",
        aliases: List<String> = listOf(),
        birthDate: ExactDate? = null,
        birthEventId: ObjectId? = null,
        birthRelativeOffset: Int? = null,
        birthRelativeTimeUnit: TimeUnit? = null,
        calculatedBirthDate: Double? = null,
        displayBirthYear: Int? = null,
        deathDate: ExactDate? = null,
        deathEventId: ObjectId? = null,
        deathRelativeOffset: Int? = null,
        deathRelativeTimeUnit: TimeUnit? = null,
        calculatedDeathDate: Double? = null,
        displayDeathYear: Int? = null,
        isAlive: Boolean = true,
        affiliation: String? = null,
        description: String? = null,
        createdAt: Long = System.currentTimeMillis(),
        createdBy: String? = null,
        updatedAt: Long = System.currentTimeMillis(),
        updatedBy: String? = null
    ) = Character(
        _id = ObjectId(id),
        name = name,
        aliases = aliases,
        birthDate = birthDate,
        birthEventId = birthEventId,
        birthRelativeOffset = birthRelativeOffset,
        birthRelativeTimeUnit = birthRelativeTimeUnit,
        calculatedBirthDate = calculatedBirthDate,
        displayBirthYear = displayBirthYear,
        deathDate = deathDate,
        deathEventId = deathEventId,
        deathRelativeOffset = deathRelativeOffset,
        deathRelativeTimeUnit = deathRelativeTimeUnit,
        calculatedDeathDate = calculatedDeathDate,
        displayDeathYear = displayDeathYear,
        isAlive = isAlive,
        affiliation = affiliation,
        description = description,
        createdAt = createdAt,
        createdBy = createdBy,
        updatedAt = updatedAt,
        updatedBy = updatedBy
    )

    fun createArc(
        id: String = ObjectId().toHexString(),
        name: String = "Test Arc",
        sagaId: ObjectId? = null,
        startChapter: Int? = 1,
        endChapter: Int? = 10,
        description: String? = null
    ) = Arc(
        _id = ObjectId(id),
        name = name,
        sagaId = sagaId,
        startChapter = startChapter,
        endChapter = endChapter,
        description = description
    )

    fun createSaga(
        id: String = ObjectId().toHexString(),
        name: String = "Test Saga",
        description: String? = null,
        order: Int = 1
    ) = Saga(
        _id = ObjectId(id),
        name = name,
        description = description,
        order = order
    )

    fun createEra(
        id: String = ObjectId().toHexString(),
        name: String = "Test Era",
        description: String? = null,
        startDate: ExactDate = ExactDate(year = 1500, month = 1, day = 1),
        endDate: ExactDate = ExactDate(year = 1520, month = 12, day = 31),
        createdAt: Long = System.currentTimeMillis(),
        createdBy: String? = "testuser",
        updatedAt: Long = System.currentTimeMillis(),
        updatedBy: String? = "testuser"
    ) = Era(
        _id = ObjectId(id),
        name = name,
        description = description,
        startDate = startDate,
        endDate = endDate,
        createdAt = createdAt,
        createdBy = createdBy,
        updatedAt = updatedAt,
        updatedBy = updatedBy
    )

    fun createLocation(
        id: String = ObjectId().toHexString(),
        name: String = "Test Location",
        type: LocationType = LocationType.Island,
        parentLocationId: ObjectId? = null,
        description: String? = null
    ) = Location(
        _id = ObjectId(id),
        name = name,
        type = type,
        parentLocationId = parentLocationId,
        description = description
    )

    fun createUser(
        id: String = ObjectId().toHexString(),
        username: String = "testuser",
        apiKey: String = "test-api-key",
        role: UserRole = UserRole.Admin,
        isActive: Boolean = true,
        createdAt: Long = System.currentTimeMillis()
    ) = User(
        _id = ObjectId(id),
        username = username,
        apiKey = apiKey,
        role = role,
        isActive = isActive,
        createdAt = createdAt
    )

    fun createEventVersion(
        id: String = ObjectId().toHexString(),
        eventId: ObjectId,
        version: Int = 1,
        event: Event,
        changedBy: String = "testuser",
        changedAt: Long = System.currentTimeMillis(),
        changeDescription: String? = null
    ) = EventVersion(
        _id = ObjectId(id),
        eventId = eventId,
        version = version,
        event = event,
        changedBy = changedBy,
        changedAt = changedAt,
        changeDescription = changeDescription
    )
}
