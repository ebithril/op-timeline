// Reference years for One Piece timeline (Kaienreki / Sea Circle Calendar)
export const SERIES_START_YEAR = 1522  // Romance Dawn arc begins
export const TIMESKIP_END_YEAR = 1524  // Return to Sabaody after 2-year timeskip

// Display mode constants
export const DisplayMode = {
  KAIENREKI: 'kaienreki',
  SERIES_START: 'seriesStart',
  TIMESKIP_END: 'timeskipEnd'
}

// Display mode labels for UI
export const displayModeLabels = {
  [DisplayMode.KAIENREKI]: 'Kaienreki (Absolute)',
  [DisplayMode.SERIES_START]: 'Relative to Series Start (1522)',
  [DisplayMode.TIMESKIP_END]: 'Relative to Timeskip End (1524)'
}

/**
 * Convert an absolute year to a relative offset from a reference year
 * @param {number} absoluteYear - The absolute year (e.g., 1520)
 * @param {number} referenceYear - The reference year (e.g., 1522)
 * @returns {number} - The relative offset (e.g., -2)
 */
export function absoluteToRelative(absoluteYear, referenceYear) {
  if (absoluteYear == null || referenceYear == null) return null
  return absoluteYear - referenceYear
}

/**
 * Convert a relative offset to an absolute year
 * @param {number} relativeOffset - The relative offset (e.g., -2)
 * @param {number} referenceYear - The reference year (e.g., 1522)
 * @returns {number} - The absolute year (e.g., 1520)
 */
export function relativeToAbsolute(relativeOffset, referenceYear) {
  if (relativeOffset == null || referenceYear == null) return null
  return referenceYear + relativeOffset
}

/**
 * Format a year for display based on the selected display mode
 * @param {number} absoluteYear - The absolute year to format
 * @param {string} displayMode - The display mode (from DisplayMode enum)
 * @returns {string} - The formatted year string
 */
export function formatYearDisplay(absoluteYear, displayMode = DisplayMode.KAIENREKI) {
  if (absoluteYear == null) return 'Unknown'

  switch (displayMode) {
    case DisplayMode.KAIENREKI:
      return `${absoluteYear}`

    case DisplayMode.SERIES_START: {
      const offset = absoluteToRelative(absoluteYear, SERIES_START_YEAR)
      if (offset === 0) return 'Series Start (1522)'
      if (offset > 0) return `+${offset} years`
      return `${offset} years`
    }

    case DisplayMode.TIMESKIP_END: {
      const offset = absoluteToRelative(absoluteYear, TIMESKIP_END_YEAR)
      if (offset === 0) return 'Timeskip End (1524)'
      if (offset > 0) return `+${offset} years`
      return `${offset} years`
    }

    default:
      return `${absoluteYear}`
  }
}

/**
 * Format a year with additional context (month/day) for display
 * @param {number} absoluteYear - The absolute year
 * @param {number|null} month - Optional month (1-12)
 * @param {number|null} day - Optional day (1-31)
 * @param {string} displayMode - The display mode
 * @returns {string} - The formatted date string
 */
export function formatFullDateDisplay(absoluteYear, month = null, day = null, displayMode = DisplayMode.KAIENREKI) {
  if (absoluteYear == null) return 'Unknown'

  const yearStr = formatYearDisplay(absoluteYear, displayMode)

  // Build the date string
  const parts = []

  if (day != null && month != null) {
    // Full date: Month Day, Year
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    parts.push(`${monthNames[month - 1]} ${day},`)
  } else if (month != null) {
    // Month and year only
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    parts.push(`${monthNames[month - 1]}`)
  }

  parts.push(yearStr)

  return parts.join(' ')
}

/**
 * Get the stored display mode preference from localStorage
 * @returns {string} - The display mode (defaults to KAIENREKI)
 */
export function getDisplayModePreference() {
  const stored = localStorage.getItem('yearDisplayMode')
  return stored && Object.values(DisplayMode).includes(stored)
    ? stored
    : DisplayMode.KAIENREKI
}

/**
 * Save the display mode preference to localStorage
 * @param {string} mode - The display mode to save
 */
export function saveDisplayModePreference(mode) {
  if (Object.values(DisplayMode).includes(mode)) {
    localStorage.setItem('yearDisplayMode', mode)
  }
}
