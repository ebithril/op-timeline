<template>
  <div class="timeline-view">
    <h1 class="text-3xl font-bold mb-6 text-one-piece-dark">One Piece Timeline</h1>

    <!-- Controls Container -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <!-- Year Display Format Selector -->
      <div class="mb-4 pb-4 border-b border-gray-200">
        <label class="block text-sm font-semibold mb-2">Display Years As:</label>
        <select
          v-model="yearDisplayMode"
          @change="saveDisplayModePreference"
          class="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
        >
          <option
            v-for="(label, mode) in displayModeLabels"
            :key="mode"
            :value="mode"
          >
            {{ label }}
          </option>
        </select>
      </div>

      <!-- Character Filter -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-semibold">Filter by Characters</h2>

          <!-- AND/OR Toggle -->
          <div v-if="selectedCharacters.length > 1" class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Match:</span>
            <div class="flex bg-gray-200 rounded">
              <button
                @click="characterFilterMode = 'any'"
                :class="[
                  'px-3 py-1 text-sm rounded transition-colors',
                  characterFilterMode === 'any'
                    ? 'bg-one-piece-primary text-white'
                    : 'text-gray-700 hover:bg-gray-300'
                ]"
              >
                Any
              </button>
              <button
                @click="characterFilterMode = 'all'"
                :class="[
                  'px-3 py-1 text-sm rounded transition-colors',
                  characterFilterMode === 'all'
                    ? 'bg-one-piece-primary text-white'
                    : 'text-gray-700 hover:bg-gray-300'
                ]"
              >
                All
              </button>
            </div>
          </div>
        </div>

        <!-- Character Search Input -->
        <div class="relative mb-3">
          <input
            v-model="characterSearchQuery"
            @input="showCharacterDropdown = true"
            @focus="showCharacterDropdown = true"
            @blur="hideDropdownDelayed"
            type="text"
            placeholder="Search characters to filter..."
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          />

          <!-- Character Suggestions Dropdown -->
          <div
            v-if="showCharacterDropdown && filteredCharacterSuggestions.length > 0"
            class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto"
          >
            <button
              v-for="character in filteredCharacterSuggestions"
              :key="character._id"
              @mousedown.prevent="addCharacterFilter(character.name)"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              {{ character.name }}
            </button>
          </div>
        </div>

        <!-- Selected Characters -->
        <div v-if="selectedCharacters.length > 0" class="flex flex-wrap gap-2">
          <div
            v-for="characterName in selectedCharacters"
            :key="characterName"
            class="flex items-center gap-2 px-3 py-1 bg-one-piece-primary text-white rounded"
          >
            <span>{{ characterName }}</span>
            <button
              @click="removeCharacterFilter(characterName)"
              class="text-white hover:text-gray-200 font-bold"
            >
              ×
            </button>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500 italic">
          No character filters selected (showing all events)
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="eventsStore.loading || charactersStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="eventsStore.error" class="bg-red-100 p-4 rounded text-red-700">
      {{ eventsStore.error }}
    </div>

    <!-- New Timeline Layout: Date on left, events in middle -->
    <div v-else class="timeline-container">
      <div v-if="filteredEvents.length === 0" class="text-center py-8 text-gray-600">
        No events found. Add some events to get started!
      </div>

      <div v-else class="max-w-6xl mx-auto py-8">
        <!-- Era Sections -->
        <div v-for="(eraData, eraIndex) in groupedByEra" :key="eraIndex" class="mb-12">
          <!-- Era Header (if era exists) -->
          <div v-if="eraData.era" class="mb-6 pb-4 border-b-4 border-one-piece-primary">
            <h2 class="text-2xl font-bold text-one-piece-dark">{{ eraData.era.name }}</h2>
            <p v-if="eraData.era.description" class="text-gray-600 mt-1">{{ eraData.era.description }}</p>
            <p class="text-sm text-gray-500 mt-1">
              {{ formatEraDate(eraData.era.startDate) }} - {{ formatEraDate(eraData.era.endDate) }}
            </p>
          </div>

          <!-- Timeline Events in this era -->
          <div class="space-y-6">
            <div
              v-for="(event, index) in eraData.events"
              :key="event._id"
              class="flex gap-6 relative"
            >
              <!-- Date Column (Left Side) -->
              <div class="w-48 flex-shrink-0 text-right pr-6 relative">
                <!-- Vertical Timeline Line -->
                <div
                  v-if="index < eraData.events.length - 1 || eraIndex < groupedByEra.length - 1"
                  class="absolute right-0 top-8 bottom-0 w-0.5 bg-one-piece-primary opacity-30"
                ></div>

                <!-- Date Display -->
                <div class="relative z-10 inline-block">
                  <div class="text-2xl font-bold text-one-piece-primary">
                    {{ getDisplayYear(event) }}
                  </div>
                  <div class="text-sm text-gray-600 mt-1">
                    {{ getDisplayMonthDay(event) }}
                  </div>
                </div>

                <!-- Timeline Dot -->
                <div class="absolute right-0 top-3 w-3 h-3 bg-one-piece-primary rounded-full border-2 border-white shadow-lg transform translate-x-1/2"></div>
              </div>

              <!-- Event Content (Center/Right Side) -->
              <div class="flex-1">
                <div class="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-one-piece-primary">
                  <!-- Event Type Badge -->
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      :class="[
                        'px-2 py-1 text-xs rounded font-semibold',
                        getEventTypeColor(event.type)
                      ]"
                    >
                      {{ event.type }}
                    </span>
                  </div>

                  <!-- Event Title -->
                  <h3 class="text-xl font-bold mb-2 text-one-piece-dark">
                    <router-link
                      :to="`/event/${event._id}`"
                      class="hover:text-one-piece-primary transition-colors"
                    >
                      {{ event.name }}
                    </router-link>
                  </h3>

                  <!-- Event Description -->
                  <p class="text-sm text-gray-700 mb-3 line-clamp-4">{{ event.description }}</p>

                  <!-- Characters -->
                  <div v-if="event.involvedCharacters.length > 0" class="mb-3">
                    <span class="text-xs font-semibold text-gray-600">Characters: </span>
                    <span class="text-xs text-gray-600">
                      {{ event.involvedCharacters.slice(0, 3).join(', ') }}
                      <span v-if="event.involvedCharacters.length > 3">...</span>
                    </span>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2 mt-3">
                    <router-link
                      v-if="authStore.isEditor"
                      :to="`/event/${event._id}/edit`"
                      class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
                    >
                      Edit
                    </router-link>
                    <button
                      v-if="authStore.isAdmin"
                      @click="deleteEvent(event._id)"
                      class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEventsStore } from '../stores/events'
import { useCharactersStore } from '../stores/characters'
import { useErasStore } from '../stores/eras'
import { useAuthStore } from '../stores/auth'
import {
  DisplayMode,
  displayModeLabels,
  formatYearDisplay,
  formatFullDateDisplay,
  getDisplayModePreference,
  saveDisplayModePreference as savePreference
} from '../utils/yearDisplay'

const eventsStore = useEventsStore()
const charactersStore = useCharactersStore()
const erasStore = useErasStore()
const authStore = useAuthStore()

const selectedCharacters = ref([])
const yearDisplayMode = ref(getDisplayModePreference())
const characterSearchQuery = ref('')
const showCharacterDropdown = ref(false)
const characterFilterMode = ref('any') // 'any' for OR, 'all' for AND

// Constants
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const DROPDOWN_HIDE_DELAY = 200 // ms - delay before hiding dropdown to allow click events to fire

// Helper function to get event year consistently across all functions
function getEventYear(event) {
  // Try to get year from various sources in priority order
  if (event.displayYear) {
    return event.displayYear
  }
  if (event.calculatedExactDate?.year) {
    return event.calculatedExactDate.year
  }
  if (event.exactDate?.year) {
    return event.exactDate.year
  }
  if (typeof event.exactDate === 'number') {
    return event.exactDate
  }
  return null
}

function saveDisplayModePreference() {
  savePreference(yearDisplayMode.value)
}

// Filter character suggestions based on search query
const filteredCharacterSuggestions = computed(() => {
  if (!characterSearchQuery.value.trim()) {
    return []
  }

  const query = characterSearchQuery.value.toLowerCase()
  return charactersStore.sortedCharacters
    .filter(char =>
      !selectedCharacters.value.includes(char.name) &&
      char.name.toLowerCase().includes(query)
    )
    .slice(0, 10) // Limit to 10 suggestions
})

const filteredEvents = computed(() => {
  if (selectedCharacters.value.length === 0) {
    return eventsStore.sortedEvents
  }

  return eventsStore.sortedEvents.filter(event => {
    if (characterFilterMode.value === 'all') {
      // AND logic: event must contain ALL selected characters
      return selectedCharacters.value.every(char =>
        event.involvedCharacters.includes(char)
      )
    } else {
      // OR logic: event must contain ANY selected character
      return event.involvedCharacters.some(char =>
        selectedCharacters.value.includes(char)
      )
    }
  })
})

// Group events by era
const groupedByEra = computed(() => {
  // Helper to check if event falls within an era
  const isInEra = (event, era) => {
    const eventYear = getEventYear(event)
    if (!eventYear) return false

    const startYear = era.startDate.year
    const endYear = era.endDate.year

    // Simple year-based check (can be made more precise if needed)
    return eventYear >= startYear && eventYear <= endYear
  }

  const result = []
  const assignedEvents = new Set()

  // Group events by era using the store's sorted eras
  for (const era of erasStore.sortedEras) {
    const eraEvents = filteredEvents.value.filter(event => {
      if (assignedEvents.has(event._id)) return false
      if (isInEra(event, era)) {
        assignedEvents.add(event._id)
        return true
      }
      return false
    })

    if (eraEvents.length > 0) {
      result.push({
        era,
        events: eraEvents
      })
    }
  }

  // Add remaining events without era
  const unassignedEvents = filteredEvents.value.filter(
    event => !assignedEvents.has(event._id)
  )

  if (unassignedEvents.length > 0) {
    result.push({
      era: null,
      events: unassignedEvents
    })
  }

  return result
})

// Character filter functions
function addCharacterFilter(characterName) {
  if (!selectedCharacters.value.includes(characterName)) {
    selectedCharacters.value.push(characterName)
    characterSearchQuery.value = ''
    showCharacterDropdown.value = false
  }
}

function removeCharacterFilter(characterName) {
  const index = selectedCharacters.value.indexOf(characterName)
  if (index !== -1) {
    selectedCharacters.value.splice(index, 1)
  }
}

function hideDropdownDelayed() {
  // Delay hiding to allow click events to fire first
  setTimeout(() => {
    showCharacterDropdown.value = false
  }, DROPDOWN_HIDE_DELAY)
}

function getEventTypeColor(type) {
  const colors = {
    Birth: 'bg-green-200 text-green-800',
    Death: 'bg-red-200 text-red-800',
    Fight: 'bg-orange-200 text-orange-800',
    Event: 'bg-blue-200 text-blue-800',
    Meeting: 'bg-purple-200 text-purple-800',
    Discovery: 'bg-yellow-200 text-yellow-800',
  }
  return colors[type] || 'bg-gray-200 text-gray-800'
}

// Get display year for timeline left column
function getDisplayYear(event) {
  const year = getEventYear(event)

  if (!year) {
    return event.dateType === 'Relative' ? 'Relative' : 'Unknown'
  }

  // Apply display mode formatting
  return formatYearDisplay(year, yearDisplayMode.value)
}

// Get display month/day for timeline left column
function getDisplayMonthDay(event) {
  let dateObj = null

  // Try to get full date from various sources
  if (event.calculatedExactDate && typeof event.calculatedExactDate === 'object') {
    dateObj = event.calculatedExactDate
  } else if (event.exactDate && typeof event.exactDate === 'object') {
    dateObj = event.exactDate
  }

  if (!dateObj || !dateObj.month) {
    // For relative dates, show relative info
    if (event.dateType === 'Relative') {
      const isVague = event.relativeOffset === null && event.relativeTimeUnit
      if (isVague) {
        const unit = event.relativeTimeUnit.toLowerCase()
        const direction = event.relativeDirection?.toLowerCase() || 'after'
        return `~${unit} ${direction}`
      } else if (event.relativeOffset && event.relativeTimeUnit) {
        const offset = Math.abs(event.relativeOffset)
        const unit = event.relativeTimeUnit.toLowerCase()
        const direction = event.relativeOffset < 0 ? 'before' : 'after'
        return `${offset} ${unit} ${direction}`
      }
    } else if (event.dateType === 'Approximation') {
      return '~Approximate'
    }
    return ''
  }

  const { month, day } = dateObj

  if (day && month) {
    return `${MONTH_NAMES[month - 1]} ${day}`
  } else if (month) {
    return MONTH_NAMES[month - 1]
  }

  return ''
}

// Format era dates for era headers
function formatEraDate(date) {
  if (!date) return 'Unknown'
  const year = formatYearDisplay(date.year, yearDisplayMode.value)
  return year
}

function formatDate(event) {
  // Helper function to format a date object using the selected display mode
  const formatDateObj = (dateObj) => {
    if (!dateObj) return null
    const { year, month, day } = dateObj
    const formattedYear = formatYearDisplay(year, yearDisplayMode.value)

    if (day && month) {
      return `${MONTH_NAMES[month - 1]} ${day}, ${formattedYear}`
    } else if (month) {
      return `${MONTH_NAMES[month - 1]} ${formattedYear}`
    } else {
      return formattedYear
    }
  }

  // Handle exact dates with year/month/day structure
  if (event.exactDate && typeof event.exactDate === 'object') {
    const dateStr = formatDateObj(event.exactDate)
    return event.dateType === 'Approximation' ? `~${dateStr}` : dateStr
  }

  // For relative dates, calculate and show the actual date
  if (event.dateType === 'Relative') {
    // Check if this is a vague relative date (has time unit but no offset)
    const isVague = event.relativeOffset === null && event.relativeTimeUnit
    const direction = isVague && event.relativeDirection
      ? event.relativeDirection.toLowerCase()
      : event.relativeOffset < 0 ? 'before' : 'after'

    // The backend should provide calculatedAbsoluteDate or we can try to calculate from the reference
    // For now, if we have exactDate calculated by backend, use it
    if (event.calculatedExactDate && typeof event.calculatedExactDate === 'object') {
      const dateStr = formatDateObj(event.calculatedExactDate)

      // Add relative context
      if (isVague) {
        const unit = event.relativeTimeUnit.toLowerCase()
        return `~${dateStr} (~${unit} ${direction})`
      } else if (event.relativeOffset && event.relativeTimeUnit) {
        const offset = Math.abs(event.relativeOffset)
        const unit = event.relativeTimeUnit.toLowerCase()
        return `${dateStr} (${offset} ${unit} ${direction})`
      }

      return dateStr
    }

    // Fallback to displayYear if available
    if (event.displayYear) {
      let baseStr = `Year ${event.displayYear}`

      if (isVague) {
        const unit = event.relativeTimeUnit.toLowerCase()
        baseStr = `~${baseStr} (~${unit} ${direction})`
      } else if (event.relativeOffset && event.relativeTimeUnit) {
        const offset = Math.abs(event.relativeOffset)
        const unit = event.relativeTimeUnit.toLowerCase()
        baseStr += ` (${offset} ${unit} ${direction})`
      }

      return baseStr
    }

    // If no calculated date but we have relative info, show that
    if (isVague) {
      const unit = event.relativeTimeUnit.toLowerCase()
      return `~${unit} ${direction}`
    } else if (event.relativeOffset && event.relativeTimeUnit) {
      const offset = Math.abs(event.relativeOffset)
      const unit = event.relativeTimeUnit.toLowerCase()
      return `${offset} ${unit} ${direction}`
    }

    return 'Relative date'
  }

  // Use displayYear if available (calculated from exact or relative dates)
  if (event.displayYear) {
    const formattedYear = formatYearDisplay(event.displayYear, yearDisplayMode.value)
    if (event.dateType === 'Approximation') {
      return `~${formattedYear}`
    }
    return formattedYear
  }

  // Fallback for old format (simple number)
  if (event.dateType === 'Exact' && event.exactDate) {
    const formattedYear = formatYearDisplay(event.exactDate, yearDisplayMode.value)
    return formattedYear
  } else if (event.dateType === 'Approximation' && event.exactDate) {
    const formattedYear = formatYearDisplay(event.exactDate, yearDisplayMode.value)
    return `~${formattedYear}`
  }

  return 'Date unknown'
}

async function deleteEvent(id) {
  if (confirm('Are you sure you want to delete this event?')) {
    try {
      await eventsStore.deleteEvent(id)
    } catch (error) {
      alert('Failed to delete event')
    }
  }
}

onMounted(async () => {
  await Promise.all([
    eventsStore.fetchAll(),
    charactersStore.fetchAll(),
    erasStore.fetchAll()
  ])
})
</script>
