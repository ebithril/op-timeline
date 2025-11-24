package util

import com.model.DateType
import com.model.Event
import com.model.EventType
import com.model.ExactDate
import com.model.Source
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.collections.shouldNotBeEmpty
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName

@DisplayName("EventDiffer Tests")
class EventDifferTest {

    @Test
    fun `generateDiff should detect name change`() {
        val oldEvent = createTestEvent(name = "Old Name")
        val newEvent = oldEvent.copy(name = "New Name")

        val patches = EventDiffer.generateDiff(oldEvent, newEvent)

        patches.shouldNotBeEmpty()
        patches.any { it.path == "/name" && it.op == "replace" } shouldBe true
    }

    @Test
    fun `generateDiff should detect description change`() {
        val oldEvent = createTestEvent(description = "Old Description")
        val newEvent = oldEvent.copy(description = "New Description")

        val patches = EventDiffer.generateDiff(oldEvent, newEvent)

        patches.shouldNotBeEmpty()
        patches.any { it.path == "/description" && it.op == "replace" } shouldBe true
    }

    @Test
    fun `generateDiff should detect exactDate change`() {
        val oldEvent = createTestEvent(
            exactDate = ExactDate(year = 2020, month = 1, day = 1)
        )
        val newEvent = oldEvent.copy(
            exactDate = ExactDate(year = 2021, month = 6, day = 15)
        )

        val patches = EventDiffer.generateDiff(oldEvent, newEvent)

        patches.shouldNotBeEmpty()
        // Should have patches for exactDate fields
        patches.any { it.path.startsWith("/exactDate") } shouldBe true
    }

    @Test
    fun `generateDiff should detect sources change`() {
        val oldEvent = createTestEvent(
            sources = listOf(
                Source(
                    sourceType = com.model.SourceType.Chapter,
                    chapter = 100,
                    isPrimary = true
                )
            )
        )
        val newEvent = oldEvent.copy(
            sources = listOf(
                Source(
                    sourceType = com.model.SourceType.Chapter,
                    chapter = 101,
                    isPrimary = true
                )
            )
        )

        val patches = EventDiffer.generateDiff(oldEvent, newEvent)

        patches.shouldNotBeEmpty()
        patches.any { it.path.startsWith("/sources") } shouldBe true
    }

    @Test
    fun `generateDiff should exclude calculated fields`() {
        val oldEvent = createTestEvent(
            calculatedAbsoluteDate = 1000.0,
            calculatedExactDate = ExactDate(2020, 1, 1),
            displayYear = 2020
        )
        val newEvent = oldEvent.copy(
            calculatedAbsoluteDate = 2000.0,
            calculatedExactDate = ExactDate(2021, 1, 1),
            displayYear = 2021
        )

        val patches = EventDiffer.generateDiff(oldEvent, newEvent)

        // Should have no patches since only calculated fields changed
        patches.shouldBe(emptyList())
    }

    @Test
    fun `generateDiff should handle multiple field changes`() {
        val oldEvent = createTestEvent(
            name = "Old Name",
            description = "Old Description",
            type = EventType.Event
        )
        val newEvent = oldEvent.copy(
            name = "New Name",
            description = "New Description",
            type = EventType.Fight
        )

        val patches = EventDiffer.generateDiff(oldEvent, newEvent)

        patches.shouldNotBeEmpty()
        patches.size shouldBe 3
    }

    @Test
    fun `generateDiff should return empty list for identical events`() {
        val event1 = createTestEvent()
        val event2 = event1.copy()

        val patches = EventDiffer.generateDiff(event1, event2)

        patches shouldBe emptyList()
    }

    @Test
    fun `extractChangedFields should extract top-level field names`() {
        val oldEvent = createTestEvent(name = "Old", description = "Old Desc")
        val newEvent = oldEvent.copy(name = "New", description = "New Desc")

        val patches = EventDiffer.generateDiff(oldEvent, newEvent)
        val changedFields = EventDiffer.extractChangedFields(patches)

        changedFields shouldContain "name"
        changedFields shouldContain "description"
    }

    @Test
    fun `extractChangedFields should extract nested field as parent field`() {
        val oldEvent = createTestEvent(
            exactDate = ExactDate(2020, 1, 1)
        )
        val newEvent = oldEvent.copy(
            exactDate = ExactDate(2021, 1, 1)
        )

        val patches = EventDiffer.generateDiff(oldEvent, newEvent)
        val changedFields = EventDiffer.extractChangedFields(patches)

        changedFields shouldContain "exactDate"
    }

    @Test
    fun `extractChangedFields should return distinct field names`() {
        val oldEvent = createTestEvent(
            sources = listOf(
                Source(sourceType = com.model.SourceType.Chapter, chapter = 100, isPrimary = true),
                Source(sourceType = com.model.SourceType.Chapter, chapter = 101, isPrimary = false)
            )
        )
        val newEvent = oldEvent.copy(
            sources = listOf(
                Source(sourceType = com.model.SourceType.Chapter, chapter = 102, isPrimary = true),
                Source(sourceType = com.model.SourceType.Chapter, chapter = 103, isPrimary = false)
            )
        )

        val patches = EventDiffer.generateDiff(oldEvent, newEvent)
        val changedFields = EventDiffer.extractChangedFields(patches)

        // Should have "sources" only once even if multiple source fields changed
        changedFields.count { it == "sources" } shouldBe 1
    }

    // Helper function to create test events
    private fun createTestEvent(
        name: String = "Test Event",
        description: String = "Test Description",
        type: EventType = EventType.Event,
        exactDate: ExactDate? = ExactDate(2020, 1, 1),
        sources: List<Source> = emptyList(),
        calculatedAbsoluteDate: Double? = null,
        calculatedExactDate: ExactDate? = null,
        displayYear: Int? = null
    ): Event {
        return Event(
            name = name,
            type = type,
            description = description,
            dateType = DateType.Exact,
            exactDate = exactDate,
            sources = sources,
            calculatedAbsoluteDate = calculatedAbsoluteDate,
            calculatedExactDate = calculatedExactDate,
            displayYear = displayYear
        )
    }
}
