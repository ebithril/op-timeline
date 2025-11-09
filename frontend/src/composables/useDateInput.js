import { ref, computed, watch } from 'vue'
import { kaienrekiToTenreki, tenrekiToKaienreki, relativeToAbsolute, absoluteToRelative, SERIES_START_YEAR } from '../utils/yearDisplay'

/**
 * Composable for managing date input with calendar conversion and relative year input
 * Used by CharacterEditView for birth/death dates
 */
export function useDateInput() {
  const dateYear = ref(null)
  const dateMonth = ref(null)
  const dateDay = ref(null)

  // Calendar input mode (Kaienreki vs Tenreki)
  const useKaienrekiInput = ref(true)

  // Relative year input mode
  const useRelativeYearInput = ref(false)
  const referenceYear = ref(SERIES_START_YEAR)
  const relativeYearOffset = ref(0)

  // Computed property for displayed year (converts between calendars)
  const displayedYear = computed({
    get: () => {
      if (dateYear.value == null) return null
      return useKaienrekiInput.value ? dateYear.value : kaienrekiToTenreki(dateYear.value)
    },
    set: (val) => {
      if (val == null) {
        dateYear.value = null
      } else {
        dateYear.value = useKaienrekiInput.value ? val : tenrekiToKaienreki(val)
      }
    }
  })

  // Computed property for the calculated absolute year
  const calculatedAbsoluteYear = computed(() => {
    return relativeToAbsolute(relativeYearOffset.value, referenceYear.value)
  })

  // Watch relative year input mode changes
  watch(useRelativeYearInput, (newValue) => {
    if (newValue && dateYear.value != null) {
      // Switching TO relative mode: convert absolute year to relative offset
      relativeYearOffset.value = absoluteToRelative(dateYear.value, referenceYear.value)
    } else if (!newValue && calculatedAbsoluteYear.value != null) {
      // Switching FROM relative mode: use calculated absolute year
      dateYear.value = calculatedAbsoluteYear.value
    }
  })

  // Watch relative year inputs and update the absolute year
  watch([relativeYearOffset, referenceYear], () => {
    if (useRelativeYearInput.value) {
      dateYear.value = calculatedAbsoluteYear.value
    }
  })

  // Watch absolute year when not in relative mode
  watch(dateYear, (newValue) => {
    if (!useRelativeYearInput.value && newValue != null && referenceYear.value != null) {
      // Update relative offset to stay in sync
      relativeYearOffset.value = absoluteToRelative(newValue, referenceYear.value)
    }
  })

  // Computed property for the full date object
  const dateObject = computed(() => {
    if (dateYear.value) {
      return {
        year: dateYear.value,
        month: dateMonth.value || null,
        day: dateDay.value || null
      }
    }
    return null
  })

  // Function to load date from existing data
  function loadDate(date) {
    if (date) {
      dateYear.value = date.year || null
      dateMonth.value = date.month || null
      dateDay.value = date.day || null
    }
  }

  return {
    // Refs
    dateYear,
    dateMonth,
    dateDay,
    useKaienrekiInput,
    useRelativeYearInput,
    referenceYear,
    relativeYearOffset,

    // Computed
    displayedYear,
    calculatedAbsoluteYear,
    dateObject,

    // Methods
    loadDate
  }
}
