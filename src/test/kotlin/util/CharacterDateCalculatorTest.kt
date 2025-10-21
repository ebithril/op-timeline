package util

import com.model.ExactDate
import com.model.TimeUnit
import com.repository.EventRepository
import com.util.CharacterDateCalculator
import helpers.TestData
import io.kotest.matchers.doubles.shouldBeExactly
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.bson.types.ObjectId
import kotlin.test.Test

class CharacterDateCalculatorTest {

    // Test calculateBirthDate with exact birth date

    @Test
    fun `calculateBirthDate - uses exact birthDate when provided`() = runTest {
        val character = TestData.createCharacter(
            birthDate = ExactDate(year = 1500, month = 5, day = 15)
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.calculateBirthDate(character, mockRepo)

        result.shouldNotBeNull()
        // 1500 years * 365 days + 4 months * 30 days + 14 days
        result shouldBeExactly (1500.0 * 365.0 + 4.0 * 30.0 + 14.0)
    }

    @Test
    fun `calculateBirthDate - uses birthDate year only`() = runTest {
        val character = TestData.createCharacter(
            birthDate = ExactDate(year = 1500, month = null, day = null)
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.calculateBirthDate(character, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1500.0 * 365.0)
    }

    @Test
    fun `calculateBirthDate - uses birthDate year and month`() = runTest {
        val character = TestData.createCharacter(
            birthDate = ExactDate(year = 1500, month = 6, day = null)
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.calculateBirthDate(character, mockRepo)

        result.shouldNotBeNull()
        // 1500 years * 365 + 5 months * 30
        result shouldBeExactly (1500.0 * 365.0 + 5.0 * 30.0)
    }

    // Test calculateBirthDate with birthEventId

    @Test
    fun `calculateBirthDate - uses birthEventId when birthDate is null`() = runTest {
        val birthEventId = ObjectId()
        val birthEvent = TestData.createEvent(
            id = birthEventId.toHexString(),
            exactDate = ExactDate(year = 1520, month = 1, day = 1),
            calculatedAbsoluteDate = 1520.0 * 365.0
        )
        val character = TestData.createCharacter(
            birthDate = null,
            birthEventId = birthEventId
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(birthEventId.toHexString()) } returns birthEvent

        val result = CharacterDateCalculator.calculateBirthDate(character, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1520.0 * 365.0)
    }

    @Test
    fun `calculateBirthDate - applies offset to birth event`() = runTest {
        val birthEventId = ObjectId()
        val birthEvent = TestData.createEvent(
            id = birthEventId.toHexString(),
            exactDate = ExactDate(year = 1520, month = 1, day = 1),
            calculatedAbsoluteDate = 1520.0 * 365.0
        )
        val character = TestData.createCharacter(
            birthDate = null,
            birthEventId = birthEventId,
            birthRelativeOffset = 10,
            birthRelativeTimeUnit = TimeUnit.Days
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(birthEventId.toHexString()) } returns birthEvent

        val result = CharacterDateCalculator.calculateBirthDate(character, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1520.0 * 365.0 + 10.0)
    }

    @Test
    fun `calculateBirthDate - applies negative offset to birth event`() = runTest {
        val birthEventId = ObjectId()
        val birthEvent = TestData.createEvent(
            id = birthEventId.toHexString(),
            exactDate = ExactDate(year = 1520, month = 1, day = 1),
            calculatedAbsoluteDate = 1520.0 * 365.0
        )
        val character = TestData.createCharacter(
            birthDate = null,
            birthEventId = birthEventId,
            birthRelativeOffset = -30,
            birthRelativeTimeUnit = TimeUnit.Days
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(birthEventId.toHexString()) } returns birthEvent

        val result = CharacterDateCalculator.calculateBirthDate(character, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1520.0 * 365.0 - 30.0)
    }

    @Test
    fun `calculateBirthDate - handles different time units for birth offset`() = runTest {
        val birthEventId = ObjectId()
        val birthEvent = TestData.createEvent(
            id = birthEventId.toHexString(),
            calculatedAbsoluteDate = 1520.0 * 365.0
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(birthEventId.toHexString()) } returns birthEvent

        // Test Years
        val char1 = TestData.createCharacter(
            birthEventId = birthEventId,
            birthRelativeOffset = 1,
            birthRelativeTimeUnit = TimeUnit.Years
        )
        val result1 = CharacterDateCalculator.calculateBirthDate(char1, mockRepo)
        result1.shouldNotBeNull()
        result1 shouldBeExactly (1520.0 * 365.0 + 365.0)

        // Test Months
        val char2 = TestData.createCharacter(
            birthEventId = birthEventId,
            birthRelativeOffset = 3,
            birthRelativeTimeUnit = TimeUnit.Months
        )
        val result2 = CharacterDateCalculator.calculateBirthDate(char2, mockRepo)
        result2.shouldNotBeNull()
        result2 shouldBeExactly (1520.0 * 365.0 + 90.0)

        // Test Weeks
        val char3 = TestData.createCharacter(
            birthEventId = birthEventId,
            birthRelativeOffset = 2,
            birthRelativeTimeUnit = TimeUnit.Weeks
        )
        val result3 = CharacterDateCalculator.calculateBirthDate(char3, mockRepo)
        result3.shouldNotBeNull()
        result3 shouldBeExactly (1520.0 * 365.0 + 14.0)
    }

    @Test
    fun `calculateBirthDate - returns null when birthEventId not found`() = runTest {
        val character = TestData.createCharacter(
            birthDate = null,
            birthEventId = ObjectId()
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(any()) } returns null

        val result = CharacterDateCalculator.calculateBirthDate(character, mockRepo)

        result.shouldBeNull()
    }

    @Test
    fun `calculateBirthDate - returns null when birth event has no calculated date`() = runTest {
        val birthEventId = ObjectId()
        val birthEvent = TestData.createEvent(
            id = birthEventId.toHexString(),
            calculatedAbsoluteDate = null
        )
        val character = TestData.createCharacter(
            birthDate = null,
            birthEventId = birthEventId
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(birthEventId.toHexString()) } returns birthEvent

        val result = CharacterDateCalculator.calculateBirthDate(character, mockRepo)

        result.shouldBeNull()
    }

    @Test
    fun `calculateBirthDate - returns null when no birth info provided`() = runTest {
        val character = TestData.createCharacter(
            birthDate = null,
            birthEventId = null
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.calculateBirthDate(character, mockRepo)

        result.shouldBeNull()
    }

    // Test calculateDeathDate with exact death date

    @Test
    fun `calculateDeathDate - uses exact deathDate when provided`() = runTest {
        val character = TestData.createCharacter(
            deathDate = ExactDate(year = 1550, month = 12, day = 31)
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.calculateDeathDate(character, mockRepo)

        result.shouldNotBeNull()
        // 1550 years * 365 + 11 months * 30 + 30 days
        result shouldBeExactly (1550.0 * 365.0 + 11.0 * 30.0 + 30.0)
    }

    @Test
    fun `calculateDeathDate - uses deathDate year only`() = runTest {
        val character = TestData.createCharacter(
            deathDate = ExactDate(year = 1550, month = null, day = null)
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.calculateDeathDate(character, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1550.0 * 365.0)
    }

    // Test calculateDeathDate with deathEventId

    @Test
    fun `calculateDeathDate - uses deathEventId when deathDate is null`() = runTest {
        val deathEventId = ObjectId()
        val deathEvent = TestData.createEvent(
            id = deathEventId.toHexString(),
            exactDate = ExactDate(year = 1550, month = 6, day = 15),
            calculatedAbsoluteDate = 1550.0 * 365.0 + 5.0 * 30.0 + 14.0
        )
        val character = TestData.createCharacter(
            deathDate = null,
            deathEventId = deathEventId
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(deathEventId.toHexString()) } returns deathEvent

        val result = CharacterDateCalculator.calculateDeathDate(character, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1550.0 * 365.0 + 5.0 * 30.0 + 14.0)
    }

    @Test
    fun `calculateDeathDate - applies offset to death event`() = runTest {
        val deathEventId = ObjectId()
        val deathEvent = TestData.createEvent(
            id = deathEventId.toHexString(),
            calculatedAbsoluteDate = 1550.0 * 365.0
        )
        val character = TestData.createCharacter(
            deathDate = null,
            deathEventId = deathEventId,
            deathRelativeOffset = 7,
            deathRelativeTimeUnit = TimeUnit.Days
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(deathEventId.toHexString()) } returns deathEvent

        val result = CharacterDateCalculator.calculateDeathDate(character, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1550.0 * 365.0 + 7.0)
    }

    @Test
    fun `calculateDeathDate - returns null when deathEventId not found`() = runTest {
        val character = TestData.createCharacter(
            deathDate = null,
            deathEventId = ObjectId()
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(any()) } returns null

        val result = CharacterDateCalculator.calculateDeathDate(character, mockRepo)

        result.shouldBeNull()
    }

    @Test
    fun `calculateDeathDate - returns null when death event has no calculated date`() = runTest {
        val deathEventId = ObjectId()
        val deathEvent = TestData.createEvent(
            id = deathEventId.toHexString(),
            calculatedAbsoluteDate = null
        )
        val character = TestData.createCharacter(
            deathDate = null,
            deathEventId = deathEventId
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(deathEventId.toHexString()) } returns deathEvent

        val result = CharacterDateCalculator.calculateDeathDate(character, mockRepo)

        result.shouldBeNull()
    }

    @Test
    fun `calculateDeathDate - returns null when no death info provided`() = runTest {
        val character = TestData.createCharacter(
            deathDate = null,
            deathEventId = null
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.calculateDeathDate(character, mockRepo)

        result.shouldBeNull()
    }

    // Test updateCharacterWithCalculatedDates

    @Test
    fun `updateCharacterWithCalculatedDates - calculates both birth and death dates`() = runTest {
        val character = TestData.createCharacter(
            birthDate = ExactDate(year = 1500, month = 1, day = 1),
            deathDate = ExactDate(year = 1550, month = 12, day = 31)
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.updateCharacterWithCalculatedDates(character, mockRepo)

        result.calculatedBirthDate.shouldNotBeNull()
        result.calculatedBirthDate shouldBeExactly (1500.0 * 365.0)

        result.calculatedDeathDate.shouldNotBeNull()
        result.calculatedDeathDate shouldBeExactly (1550.0 * 365.0 + 11.0 * 30.0 + 30.0)

        result.displayBirthYear shouldBe 1500
        result.displayDeathYear shouldBe 1550
    }

    @Test
    fun `updateCharacterWithCalculatedDates - calculates displayBirthYear from calculated date when exact date missing`() = runTest {
        val birthEventId = ObjectId()
        val birthEvent = TestData.createEvent(
            id = birthEventId.toHexString(),
            calculatedAbsoluteDate = 1520.0 * 365.0
        )
        val character = TestData.createCharacter(
            birthDate = null,
            birthEventId = birthEventId
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(birthEventId.toHexString()) } returns birthEvent

        val result = CharacterDateCalculator.updateCharacterWithCalculatedDates(character, mockRepo)

        result.displayBirthYear shouldBe 1520
    }

    @Test
    fun `updateCharacterWithCalculatedDates - calculates displayDeathYear from calculated date when exact date missing`() = runTest {
        val deathEventId = ObjectId()
        val deathEvent = TestData.createEvent(
            id = deathEventId.toHexString(),
            calculatedAbsoluteDate = 1550.0 * 365.0
        )
        val character = TestData.createCharacter(
            deathDate = null,
            deathEventId = deathEventId
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(deathEventId.toHexString()) } returns deathEvent

        val result = CharacterDateCalculator.updateCharacterWithCalculatedDates(character, mockRepo)

        result.displayDeathYear shouldBe 1550
    }

    @Test
    fun `updateCharacterWithCalculatedDates - prefers exact date year over calculated for display`() = runTest {
        val birthEventId = ObjectId()
        val birthEvent = TestData.createEvent(
            id = birthEventId.toHexString(),
            calculatedAbsoluteDate = 1525.0 * 365.0  // Different year
        )
        val character = TestData.createCharacter(
            birthDate = ExactDate(year = 1520, month = null, day = null),
            birthEventId = birthEventId  // This should be ignored since exact date exists
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(birthEventId.toHexString()) } returns birthEvent

        val result = CharacterDateCalculator.updateCharacterWithCalculatedDates(character, mockRepo)

        // Should prefer exact birthDate year
        result.displayBirthYear shouldBe 1520
    }

    @Test
    fun `updateCharacterWithCalculatedDates - handles character with no birth or death info`() = runTest {
        val character = TestData.createCharacter(
            birthDate = null,
            birthEventId = null,
            deathDate = null,
            deathEventId = null
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.updateCharacterWithCalculatedDates(character, mockRepo)

        result.calculatedBirthDate.shouldBeNull()
        result.calculatedDeathDate.shouldBeNull()
        result.displayBirthYear.shouldBeNull()
        result.displayDeathYear.shouldBeNull()
    }

    @Test
    fun `updateCharacterWithCalculatedDates - preserves original character fields`() = runTest {
        val character = TestData.createCharacter(
            name = "Monkey D. Luffy",
            aliases = listOf("Straw Hat", "Fifth Emperor"),
            affiliation = "Straw Hat Pirates",
            description = "Captain of the Straw Hat Pirates",
            isAlive = true
        )
        val mockRepo = mockk<EventRepository>()

        val result = CharacterDateCalculator.updateCharacterWithCalculatedDates(character, mockRepo)

        result.name shouldBe "Monkey D. Luffy"
        result.aliases shouldBe listOf("Straw Hat", "Fifth Emperor")
        result.affiliation shouldBe "Straw Hat Pirates"
        result.description shouldBe "Captain of the Straw Hat Pirates"
        result.isAlive shouldBe true
    }
}
