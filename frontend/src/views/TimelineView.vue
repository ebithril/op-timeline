<template>
  <div class="timeline-view">
    <h1 class="text-3xl font-bold mb-6 text-one-piece-dark">One Piece Timeline</h1>

    <!-- Character Filter -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <h2 class="text-xl font-semibold mb-3">Filter by Characters</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="character in charactersStore.sortedCharacters"
          :key="character._id"
          @click="toggleCharacterFilter(character.name)"
          :class="[
            'px-3 py-1 rounded',
            selectedCharacters.includes(character.name)
              ? 'bg-one-piece-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          {{ character.name }}
        </button>
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

    <!-- Vertical Timeline -->
    <div v-else class="vertical-timeline-container">
      <div v-if="filteredEvents.length === 0" class="text-center py-8 text-gray-600">
        No events found. Add some events to get started!
      </div>

      <div v-else class="relative max-w-5xl mx-auto">
        <!-- Vertical Timeline Line -->
        <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-one-piece-primary transform -translate-x-1/2"></div>

        <!-- Events -->
        <div class="space-y-12 py-8">
          <div
            v-for="(event, index) in filteredEvents"
            :key="event._id"
            class="relative"
          >
            <!-- Timeline Dot -->
            <div class="absolute left-1/2 w-6 h-6 bg-one-piece-primary rounded-full border-4 border-white transform -translate-x-1/2 shadow-lg z-10"></div>

            <!-- Event Card - Alternating left and right -->
            <div
              class="flex items-center"
              :class="index % 2 === 0 ? 'flex-row-reverse' : 'flex-row'"
            >
              <!-- Spacer for the other side -->
              <div class="w-1/2"></div>

              <!-- Horizontal Connector Line -->
              <div
                class="w-8 h-0.5 bg-one-piece-primary"
                :class="index % 2 === 0 ? 'ml-3' : 'mr-3'"
              ></div>

              <!-- Event Card Content -->
              <div
                class="w-1/2 bg-white p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-one-piece-primary"
                :class="index % 2 === 0 ? 'pr-5' : 'pl-5'"
              >
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs rounded font-semibold',
                      getEventTypeColor(event.type)
                    ]"
                  >
                    {{ event.type }}
                  </span>
                  <span class="text-sm text-gray-500 font-semibold">
                    {{ formatDate(event) }}
                  </span>
                </div>

                <h3 class="text-xl font-bold mb-2 text-one-piece-dark">
                  <router-link
                    :to="`/event/${event._id}`"
                    class="hover:text-one-piece-primary"
                  >
                    {{ event.name }}
                  </router-link>
                </h3>

                <p class="text-sm text-gray-700 mb-3 line-clamp-4">{{ event.description }}</p>

                <div v-if="event.involvedCharacters.length > 0" class="mb-3">
                  <span class="text-xs font-semibold text-gray-600">Characters: </span>
                  <span class="text-xs text-gray-600">
                    {{ event.involvedCharacters.slice(0, 3).join(', ') }}
                    <span v-if="event.involvedCharacters.length > 3">...</span>
                  </span>
                </div>

                <div class="flex gap-2 mt-3">
                  <router-link
                    v-if="authStore.isEditor"
                    :to="`/event/${event._id}/edit`"
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Edit
                  </router-link>
                  <button
                    v-if="authStore.isAdmin"
                    @click="deleteEvent(event._id)"
                    class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEventsStore } from '../stores/events'
import { useCharactersStore } from '../stores/characters'
import { useAuthStore } from '../stores/auth'

const eventsStore = useEventsStore()
const charactersStore = useCharactersStore()
const authStore = useAuthStore()

const selectedCharacters = ref([])

const filteredEvents = computed(() => {
  if (selectedCharacters.value.length === 0) {
    return eventsStore.sortedEvents
  }

  return eventsStore.sortedEvents.filter(event =>
    event.involvedCharacters.some(char =>
      selectedCharacters.value.includes(char)
    )
  )
})

function toggleCharacterFilter(characterName) {
  const index = selectedCharacters.value.indexOf(characterName)
  if (index === -1) {
    selectedCharacters.value.push(characterName)
  } else {
    selectedCharacters.value.splice(index, 1)
  }
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

function formatDate(event) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Helper function to format a date object
  const formatDateObj = (dateObj) => {
    if (!dateObj) return null
    const { year, month, day } = dateObj
    if (day && month) {
      return `${monthNames[month - 1]} ${day}, Year ${year}`
    } else if (month) {
      return `${monthNames[month - 1]} ${year}`
    } else {
      return `Year ${year}`
    }
  }

  // Handle exact dates with year/month/day structure
  if (event.exactDate && typeof event.exactDate === 'object') {
    const dateStr = formatDateObj(event.exactDate)
    return event.dateType === 'Approximation' ? `~${dateStr}` : dateStr
  }

  // For relative dates, calculate and show the actual date
  if (event.dateType === 'Relative') {
    // The backend should provide calculatedAbsoluteDate or we can try to calculate from the reference
    // For now, if we have exactDate calculated by backend, use it
    if (event.calculatedExactDate && typeof event.calculatedExactDate === 'object') {
      const dateStr = formatDateObj(event.calculatedExactDate)

      // Add relative context
      if (event.relativeOffset && event.relativeTimeUnit) {
        const offset = Math.abs(event.relativeOffset)
        const direction = event.relativeOffset < 0 ? 'before' : 'after'
        const unit = event.relativeTimeUnit.toLowerCase()
        return `${dateStr} (${offset} ${unit} ${direction} reference event)`
      }

      return dateStr
    }

    // Fallback to displayYear if available
    if (event.displayYear) {
      let baseStr = `Year ${event.displayYear}`

      if (event.relativeOffset && event.relativeTimeUnit) {
        const offset = Math.abs(event.relativeOffset)
        const direction = event.relativeOffset < 0 ? 'before' : 'after'
        const unit = event.relativeTimeUnit.toLowerCase()
        baseStr += ` (${offset} ${unit} ${direction} reference event)`
      }

      return baseStr
    }

    // If no calculated date but we have relative info, show that
    if (event.relativeOffset && event.relativeTimeUnit) {
      const offset = Math.abs(event.relativeOffset)
      const direction = event.relativeOffset < 0 ? 'before' : 'after'
      const unit = event.relativeTimeUnit.toLowerCase()
      return `${offset} ${unit} ${direction} another event`
    }

    return 'Relative date'
  }

  // Use displayYear if available (calculated from exact or relative dates)
  if (event.displayYear) {
    if (event.dateType === 'Approximation') {
      return `~Year ${event.displayYear}`
    }
    return `Year ${event.displayYear}`
  }

  // Fallback for old format (simple number)
  if (event.dateType === 'Exact' && event.exactDate) {
    return `Year ${event.exactDate}`
  } else if (event.dateType === 'Approximation' && event.exactDate) {
    return `~Year ${event.exactDate}`
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
    charactersStore.fetchAll()
  ])
})
</script>
