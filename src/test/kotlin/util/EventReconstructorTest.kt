package util

import com.model.DateType
import com.model.Event
import com.model.EventType
import com.model.ExactDate
import com.model.Source
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName

@DisplayName("EventReconstructor Tests")
class EventReconstructorTest {

    @Test
    fun `reconstruct should return original event with empty patches`() {
        val baseEvent = createTestEvent(name = "Base Event")

        val result = EventReconstructor.reconstruct(baseEvent, emptyList())

        result.name shouldBe "Base Event"
        result.type shouldBe baseEvent.type
        result.description shouldBe baseEvent.description
    }

    @Test
    fun `reconstruct should apply single field change`() {
        val baseEvent = createTestEvent(name = "Old Name")
        val newEvent = baseEvent.copy(name = "New Name")

        // Generate patches
        val patches = EventDiffer.generateDiff(baseEvent, newEvent)

        // Reconstruct
        val reconstructed = EventReconstructor.reconstruct(baseEvent, patches)

        reconstructed.name shouldBe "New Name"
        reconstructed.description shouldBe baseEvent.description
    }

    @Test
    fun `reconstruct should apply multiple field changes`() {
        val baseEvent = createTestEvent(
            name = "Old Name",
            description = "Old Description",
            type = EventType.Event
        )
        val newEvent = baseEvent.copy(
            name = "New Name",
            description = "New Description",
            type = EventType.Fight
        )

        val patches = EventDiffer.generateDiff(baseEvent, newEvent)
        val reconstructed = EventReconstructor.reconstruct(baseEvent, patches)

        reconstructed.name shouldBe "New Name"
        reconstructed.description shouldBe "New Description"
        reconstructed.type shouldBe EventType.Fight
    }

    @Test
    fun `reconstruct should apply sequential patches correctly`() {
        val version1 = createTestEvent(name = "Version 1", description = "Desc 1")
        val version2 = version1.copy(name = "Version 2")
        val version3 = version2.copy(description = "Desc 3")

        // Generate patches for each transition
        val patches1to2 = EventDiffer.generateDiff(version1, version2)
        val patches2to3 = EventDiffer.generateDiff(version2, version3)

        // Reconstruct version 3 from version 1
        val allPatches = patches1to2 + patches2to3
        val reconstructed = EventReconstructor.reconstruct(version1, allPatches)

        reconstructed.name shouldBe "Version 2"
        reconstructed.description shouldBe "Desc 3"
    }

    @Test
    fun `reconstruct should handle exactDate changes`() {
        val baseEvent = createTestEvent(
            exactDate = ExactDate(2020, 1, 1)
        )
        val newEvent = baseEvent.copy(
            exactDate = ExactDate(2021, 6, 15)
        )

        val patches = EventDiffer.generateDiff(baseEvent, newEvent)
        val reconstructed = EventReconstructor.reconstruct(baseEvent, patches)

        reconstructed.exactDate shouldBe ExactDate(2021, 6, 15)
    }

    @Test
    fun `reconstruct should handle sources list changes`() {
        val baseEvent = createTestEvent(
            sources = listOf(
                Source(
                    sourceType = com.model.SourceType.Chapter,
                    chapter = 100,
                    isPrimary = true
                )
            )
        )
        val newEvent = baseEvent.copy(
            sources = listOf(
                Source(
                    sourceType = com.model.SourceType.Chapter,
                    chapter = 101,
                    isPrimary = true
                ),
                Source(
                    sourceType = com.model.SourceType.SBS,
                    chapter = 450,
                    isPrimary = false
                )
            )
        )

        val patches = EventDiffer.generateDiff(baseEvent, newEvent)
        val reconstructed = EventReconstructor.reconstruct(baseEvent, patches)

        reconstructed.sources.size shouldBe 2
        reconstructed.sources[0].chapter shouldBe 101
        reconstructed.sources[1].chapter shouldBe 450
    }

    @Test
    fun `reconstruct should recalculate calculated fields`() {
        val baseEvent = createTestEvent(
            exactDate = ExactDate(2020, 1, 1),
            calculatedAbsoluteDate = null,
            displayYear = null
        )
        val newEvent = baseEvent.copy(
            exactDate = ExactDate(2021, 6, 15)
        )

        val patches = EventDiffer.generateDiff(baseEvent, newEvent)
        val reconstructed = EventReconstructor.reconstruct(baseEvent, patches)

        // Calculated fields should be populated
        reconstructed.calculatedAbsoluteDate shouldNotBe null
        reconstructed.displayYear shouldBe 2021
    }

    @Test
    fun `reconstructThroughVersions should apply multiple patch lists`() {
        val version1 = createTestEvent(name = "V1", description = "D1")
        val version2 = version1.copy(name = "V2")
        val version3 = version2.copy(description = "D3")
        val version4 = version3.copy(name = "V4", description = "D4")

        val patchLists = listOf(
            EventDiffer.generateDiff(version1, version2),
            EventDiffer.generateDiff(version2, version3),
            EventDiffer.generateDiff(version3, version4)
        )

        val reconstructed = EventReconstructor.reconstructThroughVersions(version1, patchLists)

        reconstructed.name shouldBe "V4"
        reconstructed.description shouldBe "D4"
    }

    @Test
    fun `reconstructThroughVersions should handle empty patch lists`() {
        val baseEvent = createTestEvent(name = "Base")

        val reconstructed = EventReconstructor.reconstructThroughVersions(baseEvent, emptyList())

        reconstructed.name shouldBe "Base"
        // Calculated fields should still be populated
        reconstructed.calculatedAbsoluteDate shouldNotBe null
    }

    @Test
    fun `reconstructThroughVersions should handle single patch list`() {
        val version1 = createTestEvent(name = "V1")
        val version2 = version1.copy(name = "V2")

        val patchLists = listOf(
            EventDiffer.generateDiff(version1, version2)
        )

        val reconstructed = EventReconstructor.reconstructThroughVersions(version1, patchLists)

        reconstructed.name shouldBe "V2"
    }

    // Helper function to create test events
    private fun createTestEvent(
        name: String = "Test Event",
        description: String = "Test Description",
        type: EventType = EventType.Event,
        exactDate: ExactDate? = ExactDate(2020, 1, 1),
        sources: List<Source> = emptyList(),
        calculatedAbsoluteDate: Double? = null,
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
            displayYear = displayYear
        )
    }
}
