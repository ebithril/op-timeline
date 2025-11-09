import { describe, it, expect, beforeEach } from 'vitest'
import { useDateInput } from './useDateInput'
import { nextTick } from 'vue'

describe('useDateInput', () => {
  let dateInput

  beforeEach(() => {
    dateInput = useDateInput()
  })

  describe('basic date input', () => {
    it('initializes with null values', () => {
      expect(dateInput.dateYear.value).toBeNull()
      expect(dateInput.dateMonth.value).toBeNull()
      expect(dateInput.dateDay.value).toBeNull()
      expect(dateInput.useKaienrekiInput.value).toBe(true)
      expect(dateInput.useRelativeYearInput.value).toBe(false)
    })

    it('creates dateObject when year is set', async () => {
      dateInput.dateYear.value = 1520
      dateInput.dateMonth.value = 5
      dateInput.dateDay.value = 10

      await nextTick()

      expect(dateInput.dateObject.value).toEqual({
        year: 1520,
        month: 5,
        day: 10
      })
    })

    it('returns null dateObject when year is not set', async () => {
      dateInput.dateMonth.value = 5
      dateInput.dateDay.value = 10

      await nextTick()

      expect(dateInput.dateObject.value).toBeNull()
    })

    it('handles null month and day in dateObject', async () => {
      dateInput.dateYear.value = 1520

      await nextTick()

      expect(dateInput.dateObject.value).toEqual({
        year: 1520,
        month: null,
        day: null
      })
    })
  })

  describe('calendar conversion (Kaienreki/Tenreki)', () => {
    it('defaults to Kaienreki mode', () => {
      expect(dateInput.useKaienrekiInput.value).toBe(true)
    })

    it('displayedYear returns Kaienreki year when in Kaienreki mode', async () => {
      dateInput.dateYear.value = 1520
      dateInput.useKaienrekiInput.value = true

      await nextTick()

      expect(dateInput.displayedYear.value).toBe(1520)
    })

    it('displayedYear returns Tenreki year when in Tenreki mode', async () => {
      dateInput.dateYear.value = 1520
      dateInput.useKaienrekiInput.value = false

      await nextTick()

      // Tenreki = Kaienreki + 2600
      expect(dateInput.displayedYear.value).toBe(4120)
    })

    it('setting displayedYear updates dateYear in Kaienreki mode', async () => {
      dateInput.useKaienrekiInput.value = true
      dateInput.displayedYear.value = 1520

      await nextTick()

      expect(dateInput.dateYear.value).toBe(1520)
    })

    it('setting displayedYear converts from Tenreki to Kaienreki', async () => {
      dateInput.useKaienrekiInput.value = false
      dateInput.displayedYear.value = 4120

      await nextTick()

      // Should store as Kaienreki internally
      expect(dateInput.dateYear.value).toBe(1520)
    })

    it('handles null displayedYear', async () => {
      dateInput.displayedYear.value = null

      await nextTick()

      expect(dateInput.dateYear.value).toBeNull()
      expect(dateInput.displayedYear.value).toBeNull()
    })
  })

  describe('relative year input mode', () => {
    it('initializes with default reference year', () => {
      expect(dateInput.referenceYear.value).toBe(1539) // SERIES_START_YEAR
      expect(dateInput.relativeYearOffset.value).toBe(0)
    })

    it('calculates absolute year from reference and offset', async () => {
      dateInput.referenceYear.value = 1539
      dateInput.relativeYearOffset.value = 2

      await nextTick()

      expect(dateInput.calculatedAbsoluteYear.value).toBe(1541)
    })

    it('handles negative offset', async () => {
      dateInput.referenceYear.value = 1539
      dateInput.relativeYearOffset.value = -20

      await nextTick()

      expect(dateInput.calculatedAbsoluteYear.value).toBe(1519)
    })

    it('switching to relative mode converts absolute year to offset', async () => {
      dateInput.dateYear.value = 1541
      dateInput.referenceYear.value = 1539
      dateInput.useRelativeYearInput.value = false

      await nextTick()

      dateInput.useRelativeYearInput.value = true

      await nextTick()

      expect(dateInput.relativeYearOffset.value).toBe(2)
    })

    it('switching from relative mode uses calculated absolute year', async () => {
      dateInput.useRelativeYearInput.value = true
      dateInput.referenceYear.value = 1539
      dateInput.relativeYearOffset.value = 5

      await nextTick()

      dateInput.useRelativeYearInput.value = false

      await nextTick()

      expect(dateInput.dateYear.value).toBe(1544)
    })

    it('updates absolute year when relative inputs change', async () => {
      dateInput.useRelativeYearInput.value = true
      dateInput.referenceYear.value = 1539
      dateInput.relativeYearOffset.value = 2

      await nextTick()

      expect(dateInput.dateYear.value).toBe(1541)

      dateInput.relativeYearOffset.value = 10

      await nextTick()

      expect(dateInput.dateYear.value).toBe(1549)
    })

    it('updates relative offset when absolute year changes in non-relative mode', async () => {
      dateInput.useRelativeYearInput.value = false
      dateInput.referenceYear.value = 1539
      dateInput.dateYear.value = 1520

      await nextTick()

      expect(dateInput.relativeYearOffset.value).toBe(-19)
    })

    it('does not update offset when absolute year changes in relative mode', async () => {
      dateInput.useRelativeYearInput.value = true
      dateInput.referenceYear.value = 1539
      dateInput.relativeYearOffset.value = 5

      await nextTick()

      // Manually setting dateYear should not affect offset in relative mode
      const originalOffset = dateInput.relativeYearOffset.value
      dateInput.dateYear.value = 1600

      await nextTick()

      expect(dateInput.relativeYearOffset.value).toBe(originalOffset)
    })
  })

  describe('loadDate method', () => {
    it('loads a complete date', () => {
      const testDate = {
        year: 1520,
        month: 5,
        day: 10
      }

      dateInput.loadDate(testDate)

      expect(dateInput.dateYear.value).toBe(1520)
      expect(dateInput.dateMonth.value).toBe(5)
      expect(dateInput.dateDay.value).toBe(10)
    })

    it('loads a date with only year', () => {
      const testDate = { year: 1520 }

      dateInput.loadDate(testDate)

      expect(dateInput.dateYear.value).toBe(1520)
      expect(dateInput.dateMonth.value).toBeNull()
      expect(dateInput.dateDay.value).toBeNull()
    })

    it('loads a date with year and month', () => {
      const testDate = {
        year: 1520,
        month: 5
      }

      dateInput.loadDate(testDate)

      expect(dateInput.dateYear.value).toBe(1520)
      expect(dateInput.dateMonth.value).toBe(5)
      expect(dateInput.dateDay.value).toBeNull()
    })

    it('handles null date', () => {
      dateInput.dateYear.value = 1520
      dateInput.dateMonth.value = 5

      dateInput.loadDate(null)

      // Values should remain unchanged when loading null
      expect(dateInput.dateYear.value).toBe(1520)
      expect(dateInput.dateMonth.value).toBe(5)
    })

    it('handles undefined date', () => {
      dateInput.dateYear.value = 1520

      dateInput.loadDate(undefined)

      // Values should remain unchanged
      expect(dateInput.dateYear.value).toBe(1520)
    })
  })

  describe('integration scenarios', () => {
    it('handles full workflow: load date -> modify -> get dateObject', async () => {
      // Load initial date
      dateInput.loadDate({ year: 1520, month: 5, day: 10 })

      expect(dateInput.dateObject.value).toEqual({
        year: 1520,
        month: 5,
        day: 10
      })

      // Modify date
      dateInput.dateDay.value = 15

      await nextTick()

      expect(dateInput.dateObject.value).toEqual({
        year: 1520,
        month: 5,
        day: 15
      })
    })

    it('handles calendar conversion with relative year input', async () => {
      // Start in Tenreki mode
      dateInput.useKaienrekiInput.value = false
      dateInput.displayedYear.value = 4139 // 1539 + 2600

      await nextTick()

      expect(dateInput.dateYear.value).toBe(1539)

      // Switch to relative mode
      dateInput.useRelativeYearInput.value = true

      await nextTick()

      expect(dateInput.relativeYearOffset.value).toBe(0) // 1539 - 1539 (SERIES_START_YEAR)

      // Change offset
      dateInput.relativeYearOffset.value = 2

      await nextTick()

      expect(dateInput.dateYear.value).toBe(1541)

      // Switch back to non-relative mode and check Tenreki display
      dateInput.useRelativeYearInput.value = false

      await nextTick()

      expect(dateInput.displayedYear.value).toBe(4141) // 1541 + 2600 in Tenreki mode
    })
  })
})
