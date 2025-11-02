import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SERIES_START_YEAR,
  TIMESKIP_END_YEAR,
  TENREKI_OFFSET,
  DisplayMode,
  displayModeLabels,
  absoluteToRelative,
  relativeToAbsolute,
  kaienrekiToTenreki,
  tenrekiToKaienreki,
  formatYearDisplay,
  formatFullDateDisplay,
  getDisplayModePreference,
  saveDisplayModePreference,
} from './yearDisplay'

describe('yearDisplay constants', () => {
  it('SERIES_START_YEAR should be 1539', () => {
    expect(SERIES_START_YEAR).toBe(1539)
  })

  it('TIMESKIP_END_YEAR should be 1541', () => {
    expect(TIMESKIP_END_YEAR).toBe(1541)
  })

  it('TENREKI_OFFSET should be 2600', () => {
    expect(TENREKI_OFFSET).toBe(2600)
  })

  it('DisplayMode should have correct values', () => {
    expect(DisplayMode.KAIENREKI).toBe('kaienreki')
    expect(DisplayMode.SERIES_START).toBe('seriesStart')
    expect(DisplayMode.TIMESKIP_END).toBe('timeskipEnd')
    expect(DisplayMode.TENREKI).toBe('tenreki')
  })

  it('displayModeLabels should have all modes', () => {
    expect(displayModeLabels[DisplayMode.KAIENREKI]).toBeDefined()
    expect(displayModeLabels[DisplayMode.SERIES_START]).toBeDefined()
    expect(displayModeLabels[DisplayMode.TIMESKIP_END]).toBeDefined()
    expect(displayModeLabels[DisplayMode.TENREKI]).toBeDefined()
  })
})

describe('absoluteToRelative', () => {
  it('calculates positive offset correctly', () => {
    expect(absoluteToRelative(1542, 1539)).toBe(3)
  })

  it('calculates negative offset correctly', () => {
    expect(absoluteToRelative(1537, 1539)).toBe(-2)
  })

  it('calculates zero offset for same year', () => {
    expect(absoluteToRelative(1539, 1539)).toBe(0)
  })

  it('handles timeskip end reference', () => {
    expect(absoluteToRelative(1539, 1541)).toBe(-2)
    expect(absoluteToRelative(1543, 1541)).toBe(2)
  })

  it('returns null for null absoluteYear', () => {
    expect(absoluteToRelative(null, 1539)).toBeNull()
  })

  it('returns null for null referenceYear', () => {
    expect(absoluteToRelative(1539, null)).toBeNull()
  })

  it('returns null for both null', () => {
    expect(absoluteToRelative(null, null)).toBeNull()
  })
})

describe('relativeToAbsolute', () => {
  it('calculates absolute year from positive offset', () => {
    expect(relativeToAbsolute(3, 1539)).toBe(1542)
  })

  it('calculates absolute year from negative offset', () => {
    expect(relativeToAbsolute(-2, 1539)).toBe(1537)
  })

  it('handles zero offset', () => {
    expect(relativeToAbsolute(0, 1539)).toBe(1539)
  })

  it('handles timeskip end reference', () => {
    expect(relativeToAbsolute(-2, 1541)).toBe(1539)
    expect(relativeToAbsolute(2, 1541)).toBe(1543)
  })

  it('returns null for null relativeOffset', () => {
    expect(relativeToAbsolute(null, 1539)).toBeNull()
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
    const absolute = 1537
    const relative = absoluteToRelative(absolute, SERIES_START_YEAR)
    const backToAbsolute = relativeToAbsolute(relative, SERIES_START_YEAR)
    expect(backToAbsolute).toBe(absolute)
  })

  it('round trip with timeskip end', () => {
    const absolute = 1547
    const relative = absoluteToRelative(absolute, TIMESKIP_END_YEAR)
    const backToAbsolute = relativeToAbsolute(relative, TIMESKIP_END_YEAR)
    expect(backToAbsolute).toBe(absolute)
  })
})

describe('kaienrekiToTenreki', () => {
  it('converts Kaienreki 1539 to Tenreki 4139', () => {
    expect(kaienrekiToTenreki(1539)).toBe(4139)
  })

  it('converts Kaienreki 1541 to Tenreki 4141', () => {
    expect(kaienrekiToTenreki(1541)).toBe(4141)
  })

  it('converts Kaienreki 1500 to Tenreki 4100', () => {
    expect(kaienrekiToTenreki(1500)).toBe(4100)
  })

  it('returns null for null input', () => {
    expect(kaienrekiToTenreki(null)).toBeNull()
  })
})

describe('tenrekiToKaienreki', () => {
  it('converts Tenreki 4139 to Kaienreki 1539', () => {
    expect(tenrekiToKaienreki(4139)).toBe(1539)
  })

  it('converts Tenreki 4141 to Kaienreki 1541', () => {
    expect(tenrekiToKaienreki(4141)).toBe(1541)
  })

  it('converts Tenreki 4100 to Kaienreki 1500', () => {
    expect(tenrekiToKaienreki(4100)).toBe(1500)
  })

  it('returns null for null input', () => {
    expect(tenrekiToKaienreki(null)).toBeNull()
  })
})

describe('Tenreki round trip', () => {
  it('round trip conversion preserves value', () => {
    const kaienreki = 1539
    const tenreki = kaienrekiToTenreki(kaienreki)
    const backToKaienreki = tenrekiToKaienreki(tenreki)
    expect(backToKaienreki).toBe(kaienreki)
  })
})

describe('formatYearDisplay', () => {
  describe('KAIENREKI mode', () => {
    it('formats year as string', () => {
      expect(formatYearDisplay(1537, DisplayMode.KAIENREKI)).toBe('1537')
    })

    it('handles series start year', () => {
      expect(formatYearDisplay(1539, DisplayMode.KAIENREKI)).toBe('1539')
    })

    it('handles timeskip end year', () => {
      expect(formatYearDisplay(1541, DisplayMode.KAIENREKI)).toBe('1541')
    })

    it('returns Unknown for null', () => {
      expect(formatYearDisplay(null, DisplayMode.KAIENREKI)).toBe('Unknown')
    })
  })

  describe('SERIES_START mode', () => {
    it('formats year before series start with negative offset', () => {
      expect(formatYearDisplay(1537, DisplayMode.SERIES_START)).toBe('-2 years')
    })

    it('formats year after series start with positive offset', () => {
      expect(formatYearDisplay(1542, DisplayMode.SERIES_START)).toBe('+3 years')
    })

    it('formats series start year specially', () => {
      expect(formatYearDisplay(1539, DisplayMode.SERIES_START)).toBe('Series Start (1539)')
    })

    it('returns Unknown for null', () => {
      expect(formatYearDisplay(null, DisplayMode.SERIES_START)).toBe('Unknown')
    })
  })

  describe('TIMESKIP_END mode', () => {
    it('formats year before timeskip end with negative offset', () => {
      expect(formatYearDisplay(1539, DisplayMode.TIMESKIP_END)).toBe('-2 years')
    })

    it('formats year after timeskip end with positive offset', () => {
      expect(formatYearDisplay(1543, DisplayMode.TIMESKIP_END)).toBe('+2 years')
    })

    it('formats timeskip end year specially', () => {
      expect(formatYearDisplay(1541, DisplayMode.TIMESKIP_END)).toBe('Timeskip End (1541)')
    })

    it('returns Unknown for null', () => {
      expect(formatYearDisplay(null, DisplayMode.TIMESKIP_END)).toBe('Unknown')
    })
  })

  describe('TENREKI mode', () => {
    it('formats Kaienreki 1539 as Tenreki 4139', () => {
      expect(formatYearDisplay(1539, DisplayMode.TENREKI)).toBe('4139')
    })

    it('formats Kaienreki 1541 as Tenreki 4141', () => {
      expect(formatYearDisplay(1541, DisplayMode.TENREKI)).toBe('4141')
    })

    it('formats Kaienreki 1500 as Tenreki 4100', () => {
      expect(formatYearDisplay(1500, DisplayMode.TENREKI)).toBe('4100')
    })

    it('returns Unknown for null', () => {
      expect(formatYearDisplay(null, DisplayMode.TENREKI)).toBe('Unknown')
    })
  })

  describe('default mode', () => {
    it('defaults to KAIENREKI when no mode specified', () => {
      expect(formatYearDisplay(1537)).toBe('1537')
    })

    it('uses KAIENREKI for invalid mode', () => {
      expect(formatYearDisplay(1537, 'invalid')).toBe('1537')
    })
  })
})

describe('formatFullDateDisplay', () => {
  describe('KAIENREKI mode', () => {
    it('formats full date with day, month, year', () => {
      const result = formatFullDateDisplay(1537, 7, 22, DisplayMode.KAIENREKI)
      expect(result).toBe('Jul 22, 1537')
    })

    it('formats date with month and year only', () => {
      const result = formatFullDateDisplay(1537, 7, null, DisplayMode.KAIENREKI)
      expect(result).toBe('Jul 1537')
    })

    it('formats year only', () => {
      const result = formatFullDateDisplay(1537, null, null, DisplayMode.KAIENREKI)
      expect(result).toBe('1537')
    })

    it('returns Unknown for null year', () => {
      const result = formatFullDateDisplay(null, 7, 22, DisplayMode.KAIENREKI)
      expect(result).toBe('Unknown')
    })
  })

  describe('SERIES_START mode', () => {
    it('formats full date with relative year', () => {
      const result = formatFullDateDisplay(1537, 7, 22, DisplayMode.SERIES_START)
      expect(result).toBe('Jul 22, -2 years')
    })

    it('formats month and relative year', () => {
      const result = formatFullDateDisplay(1542, 3, null, DisplayMode.SERIES_START)
      expect(result).toBe('Mar +3 years')
    })

    it('formats relative year only', () => {
      const result = formatFullDateDisplay(1539, null, null, DisplayMode.SERIES_START)
      expect(result).toBe('Series Start (1539)')
    })
  })

  describe('TIMESKIP_END mode', () => {
    it('formats full date with relative year', () => {
      const result = formatFullDateDisplay(1539, 1, 1, DisplayMode.TIMESKIP_END)
      expect(result).toBe('Jan 1, -2 years')
    })

    it('formats at timeskip end', () => {
      const result = formatFullDateDisplay(1541, 6, 15, DisplayMode.TIMESKIP_END)
      expect(result).toBe('Jun 15, Timeskip End (1541)')
    })
  })

  describe('month names', () => {
    it('uses correct month names', () => {
      expect(formatFullDateDisplay(1537, 1, 1)).toContain('Jan')
      expect(formatFullDateDisplay(1537, 2, 1)).toContain('Feb')
      expect(formatFullDateDisplay(1537, 3, 1)).toContain('Mar')
      expect(formatFullDateDisplay(1537, 4, 1)).toContain('Apr')
      expect(formatFullDateDisplay(1537, 5, 1)).toContain('May')
      expect(formatFullDateDisplay(1537, 6, 1)).toContain('Jun')
      expect(formatFullDateDisplay(1537, 7, 1)).toContain('Jul')
      expect(formatFullDateDisplay(1537, 8, 1)).toContain('Aug')
      expect(formatFullDateDisplay(1537, 9, 1)).toContain('Sep')
      expect(formatFullDateDisplay(1537, 10, 1)).toContain('Oct')
      expect(formatFullDateDisplay(1537, 11, 1)).toContain('Nov')
      expect(formatFullDateDisplay(1537, 12, 1)).toContain('Dec')
    })
  })

  describe('defaults', () => {
    it('defaults to KAIENREKI when no mode specified', () => {
      const result = formatFullDateDisplay(1537, 7, 22)
      expect(result).toBe('Jul 22, 1537')
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
