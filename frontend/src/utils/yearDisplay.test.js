import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SERIES_START_YEAR,
  TIMESKIP_END_YEAR,
  DisplayMode,
  displayModeLabels,
  absoluteToRelative,
  relativeToAbsolute,
  formatYearDisplay,
  formatFullDateDisplay,
  getDisplayModePreference,
  saveDisplayModePreference,
} from './yearDisplay'

describe('yearDisplay constants', () => {
  it('SERIES_START_YEAR should be 1522', () => {
    expect(SERIES_START_YEAR).toBe(1522)
  })

  it('TIMESKIP_END_YEAR should be 1524', () => {
    expect(TIMESKIP_END_YEAR).toBe(1524)
  })

  it('DisplayMode should have correct values', () => {
    expect(DisplayMode.KAIENREKI).toBe('kaienreki')
    expect(DisplayMode.SERIES_START).toBe('seriesStart')
    expect(DisplayMode.TIMESKIP_END).toBe('timeskipEnd')
  })

  it('displayModeLabels should have all modes', () => {
    expect(displayModeLabels[DisplayMode.KAIENREKI]).toBeDefined()
    expect(displayModeLabels[DisplayMode.SERIES_START]).toBeDefined()
    expect(displayModeLabels[DisplayMode.TIMESKIP_END]).toBeDefined()
  })
})

describe('absoluteToRelative', () => {
  it('calculates positive offset correctly', () => {
    expect(absoluteToRelative(1525, 1522)).toBe(3)
  })

  it('calculates negative offset correctly', () => {
    expect(absoluteToRelative(1520, 1522)).toBe(-2)
  })

  it('calculates zero offset for same year', () => {
    expect(absoluteToRelative(1522, 1522)).toBe(0)
  })

  it('handles timeskip end reference', () => {
    expect(absoluteToRelative(1522, 1524)).toBe(-2)
    expect(absoluteToRelative(1526, 1524)).toBe(2)
  })

  it('returns null for null absoluteYear', () => {
    expect(absoluteToRelative(null, 1522)).toBeNull()
  })

  it('returns null for null referenceYear', () => {
    expect(absoluteToRelative(1522, null)).toBeNull()
  })

  it('returns null for both null', () => {
    expect(absoluteToRelative(null, null)).toBeNull()
  })
})

describe('relativeToAbsolute', () => {
  it('calculates absolute year from positive offset', () => {
    expect(relativeToAbsolute(3, 1522)).toBe(1525)
  })

  it('calculates absolute year from negative offset', () => {
    expect(relativeToAbsolute(-2, 1522)).toBe(1520)
  })

  it('handles zero offset', () => {
    expect(relativeToAbsolute(0, 1522)).toBe(1522)
  })

  it('handles timeskip end reference', () => {
    expect(relativeToAbsolute(-2, 1524)).toBe(1522)
    expect(relativeToAbsolute(2, 1524)).toBe(1526)
  })

  it('returns null for null relativeOffset', () => {
    expect(relativeToAbsolute(null, 1522)).toBeNull()
  })

  it('returns null for null referenceYear', () => {
    expect(relativeToAbsolute(5, null)).toBeNull()
  })

  it('returns null for both null', () => {
    expect(relativeToAbsolute(null, null)).toBeNull()
  })
})

describe('absoluteToRelative and relativeToAbsolute round trip', () => {
  it('round trip with series start', () => {
    const absolute = 1520
    const relative = absoluteToRelative(absolute, SERIES_START_YEAR)
    const backToAbsolute = relativeToAbsolute(relative, SERIES_START_YEAR)
    expect(backToAbsolute).toBe(absolute)
  })

  it('round trip with timeskip end', () => {
    const absolute = 1530
    const relative = absoluteToRelative(absolute, TIMESKIP_END_YEAR)
    const backToAbsolute = relativeToAbsolute(relative, TIMESKIP_END_YEAR)
    expect(backToAbsolute).toBe(absolute)
  })
})

describe('formatYearDisplay', () => {
  describe('KAIENREKI mode', () => {
    it('formats year as string', () => {
      expect(formatYearDisplay(1520, DisplayMode.KAIENREKI)).toBe('1520')
    })

    it('handles series start year', () => {
      expect(formatYearDisplay(1522, DisplayMode.KAIENREKI)).toBe('1522')
    })

    it('handles timeskip end year', () => {
      expect(formatYearDisplay(1524, DisplayMode.KAIENREKI)).toBe('1524')
    })

    it('returns Unknown for null', () => {
      expect(formatYearDisplay(null, DisplayMode.KAIENREKI)).toBe('Unknown')
    })
  })

  describe('SERIES_START mode', () => {
    it('formats year before series start with negative offset', () => {
      expect(formatYearDisplay(1520, DisplayMode.SERIES_START)).toBe('-2 years')
    })

    it('formats year after series start with positive offset', () => {
      expect(formatYearDisplay(1525, DisplayMode.SERIES_START)).toBe('+3 years')
    })

    it('formats series start year specially', () => {
      expect(formatYearDisplay(1522, DisplayMode.SERIES_START)).toBe('Series Start (1522)')
    })

    it('returns Unknown for null', () => {
      expect(formatYearDisplay(null, DisplayMode.SERIES_START)).toBe('Unknown')
    })
  })

  describe('TIMESKIP_END mode', () => {
    it('formats year before timeskip end with negative offset', () => {
      expect(formatYearDisplay(1522, DisplayMode.TIMESKIP_END)).toBe('-2 years')
    })

    it('formats year after timeskip end with positive offset', () => {
      expect(formatYearDisplay(1526, DisplayMode.TIMESKIP_END)).toBe('+2 years')
    })

    it('formats timeskip end year specially', () => {
      expect(formatYearDisplay(1524, DisplayMode.TIMESKIP_END)).toBe('Timeskip End (1524)')
    })

    it('returns Unknown for null', () => {
      expect(formatYearDisplay(null, DisplayMode.TIMESKIP_END)).toBe('Unknown')
    })
  })

  describe('default mode', () => {
    it('defaults to KAIENREKI when no mode specified', () => {
      expect(formatYearDisplay(1520)).toBe('1520')
    })

    it('uses KAIENREKI for invalid mode', () => {
      expect(formatYearDisplay(1520, 'invalid')).toBe('1520')
    })
  })
})

describe('formatFullDateDisplay', () => {
  describe('KAIENREKI mode', () => {
    it('formats full date with day, month, year', () => {
      const result = formatFullDateDisplay(1520, 7, 22, DisplayMode.KAIENREKI)
      expect(result).toBe('Jul 22, 1520')
    })

    it('formats date with month and year only', () => {
      const result = formatFullDateDisplay(1520, 7, null, DisplayMode.KAIENREKI)
      expect(result).toBe('Jul 1520')
    })

    it('formats year only', () => {
      const result = formatFullDateDisplay(1520, null, null, DisplayMode.KAIENREKI)
      expect(result).toBe('1520')
    })

    it('returns Unknown for null year', () => {
      const result = formatFullDateDisplay(null, 7, 22, DisplayMode.KAIENREKI)
      expect(result).toBe('Unknown')
    })
  })

  describe('SERIES_START mode', () => {
    it('formats full date with relative year', () => {
      const result = formatFullDateDisplay(1520, 7, 22, DisplayMode.SERIES_START)
      expect(result).toBe('Jul 22, -2 years')
    })

    it('formats month and relative year', () => {
      const result = formatFullDateDisplay(1525, 3, null, DisplayMode.SERIES_START)
      expect(result).toBe('Mar +3 years')
    })

    it('formats relative year only', () => {
      const result = formatFullDateDisplay(1522, null, null, DisplayMode.SERIES_START)
      expect(result).toBe('Series Start (1522)')
    })
  })

  describe('TIMESKIP_END mode', () => {
    it('formats full date with relative year', () => {
      const result = formatFullDateDisplay(1522, 1, 1, DisplayMode.TIMESKIP_END)
      expect(result).toBe('Jan 1, -2 years')
    })

    it('formats at timeskip end', () => {
      const result = formatFullDateDisplay(1524, 6, 15, DisplayMode.TIMESKIP_END)
      expect(result).toBe('Jun 15, Timeskip End (1524)')
    })
  })

  describe('month names', () => {
    it('uses correct month names', () => {
      expect(formatFullDateDisplay(1520, 1, 1)).toContain('Jan')
      expect(formatFullDateDisplay(1520, 2, 1)).toContain('Feb')
      expect(formatFullDateDisplay(1520, 3, 1)).toContain('Mar')
      expect(formatFullDateDisplay(1520, 4, 1)).toContain('Apr')
      expect(formatFullDateDisplay(1520, 5, 1)).toContain('May')
      expect(formatFullDateDisplay(1520, 6, 1)).toContain('Jun')
      expect(formatFullDateDisplay(1520, 7, 1)).toContain('Jul')
      expect(formatFullDateDisplay(1520, 8, 1)).toContain('Aug')
      expect(formatFullDateDisplay(1520, 9, 1)).toContain('Sep')
      expect(formatFullDateDisplay(1520, 10, 1)).toContain('Oct')
      expect(formatFullDateDisplay(1520, 11, 1)).toContain('Nov')
      expect(formatFullDateDisplay(1520, 12, 1)).toContain('Dec')
    })
  })

  describe('defaults', () => {
    it('defaults to KAIENREKI when no mode specified', () => {
      const result = formatFullDateDisplay(1520, 7, 22)
      expect(result).toBe('Jul 22, 1520')
    })
  })
})

describe('localStorage integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('getDisplayModePreference', () => {
    it('returns KAIENREKI by default', () => {
      expect(getDisplayModePreference()).toBe(DisplayMode.KAIENREKI)
    })

    it('returns stored preference', () => {
      localStorage.setItem('yearDisplayMode', DisplayMode.SERIES_START)
      expect(getDisplayModePreference()).toBe(DisplayMode.SERIES_START)
    })

    it('returns KAIENREKI for invalid stored value', () => {
      localStorage.setItem('yearDisplayMode', 'invalid')
      expect(getDisplayModePreference()).toBe(DisplayMode.KAIENREKI)
    })

    it('handles all valid display modes', () => {
      localStorage.setItem('yearDisplayMode', DisplayMode.KAIENREKI)
      expect(getDisplayModePreference()).toBe(DisplayMode.KAIENREKI)

      localStorage.setItem('yearDisplayMode', DisplayMode.SERIES_START)
      expect(getDisplayModePreference()).toBe(DisplayMode.SERIES_START)

      localStorage.setItem('yearDisplayMode', DisplayMode.TIMESKIP_END)
      expect(getDisplayModePreference()).toBe(DisplayMode.TIMESKIP_END)
    })
  })

  describe('saveDisplayModePreference', () => {
    it('saves valid display mode', () => {
      saveDisplayModePreference(DisplayMode.SERIES_START)
      expect(localStorage.getItem('yearDisplayMode')).toBe(DisplayMode.SERIES_START)
    })

    it('does not save invalid display mode', () => {
      saveDisplayModePreference('invalid')
      expect(localStorage.getItem('yearDisplayMode')).toBeNull()
    })

    it('saves all valid display modes', () => {
      saveDisplayModePreference(DisplayMode.KAIENREKI)
      expect(localStorage.getItem('yearDisplayMode')).toBe(DisplayMode.KAIENREKI)

      saveDisplayModePreference(DisplayMode.SERIES_START)
      expect(localStorage.getItem('yearDisplayMode')).toBe(DisplayMode.SERIES_START)

      saveDisplayModePreference(DisplayMode.TIMESKIP_END)
      expect(localStorage.getItem('yearDisplayMode')).toBe(DisplayMode.TIMESKIP_END)
    })

    it('overwrites previous preference', () => {
      saveDisplayModePreference(DisplayMode.KAIENREKI)
      saveDisplayModePreference(DisplayMode.TIMESKIP_END)
      expect(localStorage.getItem('yearDisplayMode')).toBe(DisplayMode.TIMESKIP_END)
    })
  })

  describe('round trip save and load', () => {
    it('saves and loads correctly', () => {
      saveDisplayModePreference(DisplayMode.SERIES_START)
      const loaded = getDisplayModePreference()
      expect(loaded).toBe(DisplayMode.SERIES_START)
    })
  })
})
