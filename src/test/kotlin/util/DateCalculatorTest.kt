package util

import com.model.DateType
import com.model.Event
import com.model.ExactDate
import com.model.RelativeDirection
import com.model.TimeUnit
import com.repository.EventRepository
import com.util.DateCalculator
import helpers.TestData
import io.kotest.matchers.doubles.shouldBeExactly
import io.kotest.matchers.doubles.shouldBeGreaterThan
import io.kotest.matchers.doubles.shouldBeLessThan
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.bson.types.ObjectId
import kotlin.test.Test

class DateCalculatorTest {

    // Test exactDateToDays conversion through calculateAbsoluteDate

    @Test
    fun `exactDateToDays - year only`() = runTest {
        val event = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = null, day = null)
        )
        val mockRepo = mockk<EventRepository>()

        val result = DateCalculator.calculateAbsoluteDate(event, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1500.0 * 365.0)
    }

    @Test
    fun `exactDateToDays - year and month`() = runTest {
        val event = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 6, day = null)
        )
        val mockRepo = mockk<EventRepository>()

        val result = DateCalculator.calculateAbsoluteDate(event, mockRepo)

        result.shouldNotBeNull()
        // Year 1500 * 365 + (month 6 - 1) * 30
        result shouldBeExactly (1500.0 * 365.0 + 5.0 * 30.0)
    }

    @Test
    fun `exactDateToDays - full date`() = runTest {
        val event = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 6, day = 15)
        )
        val mockRepo = mockk<EventRepository>()

        val result = DateCalculator.calculateAbsoluteDate(event, mockRepo)

        result.shouldNotBeNull()
        // Year 1500 * 365 + (month 6 - 1) * 30 + (day 15 - 1)
        result shouldBeExactly (1500.0 * 365.0 + 5.0 * 30.0 + 14.0)
    }

    @Test
    fun `exactDateToDays - year 0`() = runTest {
        val event = TestData.createEvent(
            exactDate = ExactDate(year = 0, month = 1, day = 1)
        )
        val mockRepo = mockk<EventRepository>()

        val result = DateCalculator.calculateAbsoluteDate(event, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly 0.0
    }

    @Test
    fun `exactDateToDays - reference years SERIES_START_YEAR`() = runTest {
        val event = TestData.createEvent(
            exactDate = ExactDate(year = DateCalculator.SERIES_START_YEAR, month = 1, day = 1)
        )
        val mockRepo = mockk<EventRepository>()

        val result = DateCalculator.calculateAbsoluteDate(event, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1522.0 * 365.0)
    }

    @Test
    fun `exactDateToDays - reference years TIMESKIP_END_YEAR`() = runTest {
        val event = TestData.createEvent(
            exactDate = ExactDate(year = DateCalculator.TIMESKIP_END_YEAR, month = 1, day = 1)
        )
        val mockRepo = mockk<EventRepository>()

        val result = DateCalculator.calculateAbsoluteDate(event, mockRepo)

        result.shouldNotBeNull()
        result shouldBeExactly (1524.0 * 365.0)
    }

    // Test daysToExactDate conversion through calculateExactDate

    @Test
    fun `daysToExactDate - round trip conversion year only`() = runTest {
        val originalDate = ExactDate(year = 1500, month = null, day = null)
        val event = TestData.createEvent(exactDate = originalDate)
        val mockRepo = mockk<EventRepository>()

        val absoluteDays = DateCalculator.calculateAbsoluteDate(event, mockRepo)
        absoluteDays.shouldNotBeNull()

        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = event._id,
            relativeOffset = 0,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )
        coEvery { mockRepo.findById(event._id!!.toHexString()) } returns event

        val result = DateCalculator.calculateExactDate(relativeEvent, mockRepo)

        result.shouldNotBeNull()
        result.year shouldBe 1500
        result.month shouldBe 1
        result.day shouldBe 1
    }

    @Test
    fun `daysToExactDate - round trip conversion full date`() = runTest {
        val originalDate = ExactDate(year = 1520, month = 7, day = 22)
        val event = TestData.createEvent(exactDate = originalDate)
        val mockRepo = mockk<EventRepository>()

        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = event._id,
            relativeOffset = 0,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )
        coEvery { mockRepo.findById(event._id!!.toHexString()) } returns event

        val result = DateCalculator.calculateExactDate(relativeEvent, mockRepo)

        result.shouldNotBeNull()
        result.year shouldBe 1520
        result.month shouldBe 7
        result.day shouldBe 22
    }

    // Test timeUnitToDays through relative date calculations

    @Test
    fun `timeUnitToDays - Minutes`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = 1440, // 1 day in minutes
            relativeTimeUnit = TimeUnit.Minutes,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val baseDate = DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)
        val relativeDate = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        baseDate.shouldNotBeNull()
        relativeDate.shouldNotBeNull()
        (relativeDate - baseDate!!) shouldBeExactly 1.0
    }

    @Test
    fun `timeUnitToDays - Hours`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = 48, // 2 days in hours
            relativeTimeUnit = TimeUnit.Hours,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val baseDate = DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)
        val relativeDate = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        baseDate.shouldNotBeNull()
        relativeDate.shouldNotBeNull()
        (relativeDate - baseDate!!) shouldBeExactly 2.0
    }

    @Test
    fun `timeUnitToDays - Days`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = 5,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val baseDate = DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)
        val relativeDate = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        baseDate.shouldNotBeNull()
        relativeDate.shouldNotBeNull()
        (relativeDate - baseDate!!) shouldBeExactly 5.0
    }

    @Test
    fun `timeUnitToDays - Weeks`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = 2,
            relativeTimeUnit = TimeUnit.Weeks,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val baseDate = DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)
        val relativeDate = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        baseDate.shouldNotBeNull()
        relativeDate.shouldNotBeNull()
        (relativeDate - baseDate!!) shouldBeExactly 14.0
    }

    @Test
    fun `timeUnitToDays - Months`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = 3,
            relativeTimeUnit = TimeUnit.Months,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val baseDate = DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)
        val relativeDate = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        baseDate.shouldNotBeNull()
        relativeDate.shouldNotBeNull()
        (relativeDate - baseDate!!) shouldBeExactly 90.0 // 3 * 30
    }

    @Test
    fun `timeUnitToDays - Years`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = 2,
            relativeTimeUnit = TimeUnit.Years,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val baseDate = DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)
        val relativeDate = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        baseDate.shouldNotBeNull()
        relativeDate.shouldNotBeNull()
        (relativeDate - baseDate!!) shouldBeExactly 730.0 // 2 * 365
    }

    @Test
    fun `timeUnitToDays - negative offset (before)`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = -10,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val baseDate = DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)
        val relativeDate = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        baseDate.shouldNotBeNull()
        relativeDate.shouldNotBeNull()
        (relativeDate - baseDate!!) shouldBeExactly -10.0
        relativeDate shouldBeLessThan baseDate
    }

    // Test getVagueOffsetMidpoint

    @Test
    fun `vague relative date - Minutes After`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = null,
            relativeTimeUnit = TimeUnit.Minutes,
            relativeDirection = RelativeDirection.After,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val result = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        result.shouldNotBeNull()
        result shouldBeGreaterThan DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)!!
    }

    @Test
    fun `vague relative date - Days Before`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = null,
            relativeTimeUnit = TimeUnit.Days,
            relativeDirection = RelativeDirection.Before,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val result = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        result.shouldNotBeNull()
        result shouldBeLessThan DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)!!
    }

    @Test
    fun `vague relative date - null direction defaults to After`() = runTest {
        val baseEvent = TestData.createEvent(
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEvent._id,
            relativeOffset = null,
            relativeTimeUnit = TimeUnit.Weeks,
            relativeDirection = null,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEvent._id!!.toHexString()) } returns baseEvent

        val result = DateCalculator.calculateAbsoluteDate(relativeEvent, mockRepo)

        result.shouldNotBeNull()
        result shouldBeGreaterThan DateCalculator.calculateAbsoluteDate(baseEvent, mockRepo)!!
    }

    // Test calculateAbsoluteDate - circular dependency detection

    @Test
    fun `calculateAbsoluteDate - detects direct circular reference`() = runTest {
        val event1Id = ObjectId()
        val event2Id = ObjectId()

        val event1 = TestData.createEvent(
            id = event1Id.toHexString(),
            exactDate = null,
            relativeEventId = event2Id,
            relativeOffset = 1,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )
        val event2 = TestData.createEvent(
            id = event2Id.toHexString(),
            exactDate = null,
            relativeEventId = event1Id,
            relativeOffset = 1,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(event1Id.toHexString()) } returns event1
        coEvery { mockRepo.findById(event2Id.toHexString()) } returns event2

        val result = DateCalculator.calculateAbsoluteDate(event1, mockRepo)

        result.shouldBeNull()
    }

    @Test
    fun `calculateAbsoluteDate - detects indirect circular reference`() = runTest {
        val event1Id = ObjectId()
        val event2Id = ObjectId()
        val event3Id = ObjectId()

        val event1 = TestData.createEvent(
            id = event1Id.toHexString(),
            exactDate = null,
            relativeEventId = event2Id,
            relativeOffset = 1,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )
        val event2 = TestData.createEvent(
            id = event2Id.toHexString(),
            exactDate = null,
            relativeEventId = event3Id,
            relativeOffset = 1,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )
        val event3 = TestData.createEvent(
            id = event3Id.toHexString(),
            exactDate = null,
            relativeEventId = event1Id,
            relativeOffset = 1,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(event1Id.toHexString()) } returns event1
        coEvery { mockRepo.findById(event2Id.toHexString()) } returns event2
        coEvery { mockRepo.findById(event3Id.toHexString()) } returns event3

        val result = DateCalculator.calculateAbsoluteDate(event1, mockRepo)

        result.shouldBeNull()
    }

    @Test
    fun `calculateAbsoluteDate - chain of relative dates`() = runTest {
        val event1Id = ObjectId()
        val event2Id = ObjectId()
        val event3Id = ObjectId()

        val event1 = TestData.createEvent(
            id = event1Id.toHexString(),
            exactDate = ExactDate(year = 1500, month = 1, day = 1)
        )
        val event2 = TestData.createEvent(
            id = event2Id.toHexString(),
            exactDate = null,
            relativeEventId = event1Id,
            relativeOffset = 10,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )
        val event3 = TestData.createEvent(
            id = event3Id.toHexString(),
            exactDate = null,
            relativeEventId = event2Id,
            relativeOffset = 5,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(event1Id.toHexString()) } returns event1
        coEvery { mockRepo.findById(event2Id.toHexString()) } returns event2

        val baseDate = DateCalculator.calculateAbsoluteDate(event1, mockRepo)
        val result = DateCalculator.calculateAbsoluteDate(event3, mockRepo)

        baseDate.shouldNotBeNull()
        result.shouldNotBeNull()
        (result - baseDate) shouldBeExactly 15.0 // 10 + 5
    }

    // Test calculateAbsoluteDate - null cases

    @Test
    fun `calculateAbsoluteDate - approximation returns null`() = runTest {
        val event = TestData.createEvent(
            exactDate = null,
            dateType = DateType.Approximation,
            approximateDescription = "Sometime in the past"
        )
        val mockRepo = mockk<EventRepository>()

        val result = DateCalculator.calculateAbsoluteDate(event, mockRepo)

        result.shouldBeNull()
    }

    @Test
    fun `calculateAbsoluteDate - relative with missing referenced event returns null`() = runTest {
        val event = TestData.createEvent(
            exactDate = null,
            relativeEventId = ObjectId(),
            relativeOffset = 1,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )
        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(any()) } returns null

        val result = DateCalculator.calculateAbsoluteDate(event, mockRepo)

        result.shouldBeNull()
    }

    // Test calculateExactDate

    @Test
    fun `calculateExactDate - returns existing exact date`() = runTest {
        val exactDate = ExactDate(year = 1520, month = 7, day = 22)
        val event = TestData.createEvent(exactDate = exactDate)
        val mockRepo = mockk<EventRepository>()

        val result = DateCalculator.calculateExactDate(event, mockRepo)

        result.shouldNotBeNull()
        result shouldBe exactDate
    }

    @Test
    fun `calculateExactDate - calculates from relative date`() = runTest {
        val baseEventId = ObjectId()

        val baseEvent = TestData.createEvent(
            id = baseEventId.toHexString(),
            exactDate = ExactDate(year = 1520, month = 1, day = 1)
        )
        val relativeEvent = TestData.createEvent(
            exactDate = null,
            relativeEventId = baseEventId,
            relativeOffset = 30,
            relativeTimeUnit = TimeUnit.Days,
            dateType = DateType.Relative
        )

        val mockRepo = mockk<EventRepository>()
        coEvery { mockRepo.findById(baseEventId.toHexString()) } returns baseEvent

        val result = DateCalculator.calculateExactDate(relativeEvent, mockRepo)

        result.shouldNotBeNull()
        result.year shouldBe 1520
        result.month shouldBe 2
        result.day shouldBe 1 // 30 days after Jan 1 = Feb 1
    }

    @Test
    fun `calculateExactDate - approximation returns null`() = runTest {
        val event = TestData.createEvent(
            exactDate = null,
            dateType = DateType.Approximation,
            approximateDescription = "Long ago"
        )
        val mockRepo = mockk<EventRepository>()

        val result = DateCalculator.calculateExactDate(event, mockRepo)

        result.shouldBeNull()
    }
}
