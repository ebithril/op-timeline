<template>
  <div class="event-detail">
    <div v-if="eventsStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <div v-else-if="eventsStore.currentEvent" class="bg-white p-8 rounded-lg shadow-lg">
      <div class="flex justify-between items-start mb-6">
        <h1 class="text-4xl font-bold text-one-piece-dark">
          {{ eventsStore.currentEvent.name }}
        </h1>
        <div class="flex gap-2">
          <router-link
            v-if="authStore.isEditor"
            :to="`/event/${eventId}/edit`"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </router-link>
          <button
            @click="showHistory = !showHistory"
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {{ showHistory ? 'Hide' : 'Show' }} History
          </button>
        </div>
      </div>

      <div class="mb-4">
        <span
          :class="[
            'px-3 py-1 text-sm rounded font-semibold',
            getEventTypeColor(eventsStore.currentEvent.type)
          ]"
        >
          {{ eventsStore.currentEvent.type }}
        </span>
        <span class="ml-3 text-gray-600">
          {{ formatDate(eventsStore.currentEvent) }}
        </span>
      </div>

      <p class="text-lg text-gray-700 mb-6 whitespace-pre-wrap">
        {{ eventsStore.currentEvent.description }}
      </p>

      <div v-if="eventsStore.currentEvent.involvedCharacters.length > 0" class="mb-6">
        <h2 class="text-2xl font-semibold mb-3">Involved Characters</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="character in eventsStore.currentEvent.involvedCharacters"
            :key="character"
            class="px-3 py-1 bg-blue-100 text-blue-800 rounded"
          >
            {{ character }}
          </span>
        </div>
      </div>

      <!-- Characters Alive at this Time -->
      <div v-if="charactersAlive.length > 0" class="mb-6">
        <h2 class="text-2xl font-semibold mb-3">Characters Alive at this Time</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="character in charactersAlive"
            :key="character._id"
            class="px-3 py-1 bg-green-100 text-green-800 rounded"
          >
            {{ character.name }}
            <span v-if="character.age !== null && character.age !== undefined" class="text-xs ml-1">
              ({{ character.age }} years old)
            </span>
          </span>
        </div>
      </div>

      <div v-if="eventsStore.currentEvent.sources.length > 0" class="mb-6">
        <h2 class="text-2xl font-semibold mb-3">Sources</h2>
        <div class="space-y-3">
          <div
            v-for="(source, index) in eventsStore.currentEvent.sources"
            :key="index"
            class="p-4 rounded border-l-4"
            :class="source.isPrimary ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-400'"
          >
            <div class="flex items-start justify-between mb-2">
              <div>
                <span class="font-semibold text-gray-800">{{ source.sourceType }}</span>
                <span v-if="source.isPrimary" class="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded">Primary</span>
              </div>
            </div>

            <div class="text-sm text-gray-600 space-y-1">
              <div v-if="source.chapter || source.page">
                <span v-if="source.chapter">Chapter {{ source.chapter }}</span>
                <span v-if="source.page && source.chapter">, </span>
                <span v-if="source.page">Page {{ source.page }}</span>
              </div>

              <div v-if="source.notes" class="text-gray-700 italic">
                {{ source.notes }}
              </div>

              <div v-if="source.url">
                <a
                  :href="source.url"
                  target="_blank"
                  class="text-blue-500 hover:underline"
                >
                  View Source →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Child Events -->
      <div v-if="childEvents.length > 0" class="mb-6">
        <h2 class="text-2xl font-semibold mb-3">Sub-Events</h2>
        <div class="space-y-2">
          <router-link
            v-for="child in childEvents"
            :key="child._id"
            :to="`/event/${child._id}`"
            class="block p-4 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold text-lg">{{ child.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ child.description }}</p>
                <div class="flex items-center gap-3 mt-2">
                  <span
                    :class="[
                      'px-2 py-0.5 text-xs rounded font-semibold',
                      getEventTypeColor(child.type)
                    ]"
                  >
                    {{ child.type }}
                  </span>
                  <span class="text-xs text-gray-600">
                    {{ formatDate(child) }}
                  </span>
                </div>
              </div>
              <span class="text-blue-500">→</span>
            </div>
          </router-link>
        </div>
      </div>

      <div class="text-sm text-gray-500 mt-6 pt-6 border-t">
        <p>Created by {{ eventsStore.currentEvent.createdBy || 'Unknown' }} on {{ formatTimestamp(eventsStore.currentEvent.createdAt) }}</p>
        <p>Last updated by {{ eventsStore.currentEvent.updatedBy || 'Unknown' }} on {{ formatTimestamp(eventsStore.currentEvent.updatedAt) }}</p>
        <p>Version {{ eventsStore.currentEvent.version }}</p>
      </div>

      <!-- Version History -->
      <div v-if="showHistory" class="mt-8 pt-8 border-t">
        <h2 class="text-2xl font-semibold mb-4">Version History</h2>

        <div v-if="eventsStore.loading" class="text-center py-4">
          <p class="text-gray-600">Loading history...</p>
        </div>

        <div v-else-if="eventsStore.eventHistory.length === 0" class="text-gray-600">
          No version history available
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="version in eventsStore.eventHistory"
            :key="version._id"
            class="p-4 bg-gray-50 rounded"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="font-semibold">Version {{ version.version }}</span>
                <span class="text-sm text-gray-600 ml-3">
                  by {{ version.changedBy }} on {{ formatTimestamp(version.changedAt) }}
                </span>
              </div>
              <button
                v-if="authStore.isAdmin"
                @click="revertToVersion(version.version)"
                class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
              >
                Revert
              </button>
            </div>
            <p v-if="version.changeDescription" class="text-sm text-gray-600">
              {{ version.changeDescription }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-red-100 p-4 rounded text-red-700">
      Event not found
    </div>

    <div class="mt-6">
      <router-link to="/" class="text-blue-500 hover:underline">
        ← Back to Timeline
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventsStore } from '../stores/events'
import { useAuthStore } from '../stores/auth'
import { useCharactersStore } from '../stores/characters'

const route = useRoute()
const eventsStore = useEventsStore()
const authStore = useAuthStore()
const charactersStore = useCharactersStore()

const eventId = ref(route.params.id)
const showHistory = ref(false)
const charactersAlive = ref([])
const childEvents = ref([])

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
        return `~${dateStr} (~${unit} ${direction} reference event)`
      } else if (event.relativeOffset && event.relativeTimeUnit) {
        const offset = Math.abs(event.relativeOffset)
        const unit = event.relativeTimeUnit.toLowerCase()
        return `${dateStr} (${offset} ${unit} ${direction} reference event)`
      }

      return dateStr
    }

    // Fallback to displayYear if available
    if (event.displayYear) {
      let baseStr = `Year ${event.displayYear}`

      if (isVague) {
        const unit = event.relativeTimeUnit.toLowerCase()
        baseStr = `~${baseStr} (~${unit} ${direction} reference event)`
      } else if (event.relativeOffset && event.relativeTimeUnit) {
        const offset = Math.abs(event.relativeOffset)
        const unit = event.relativeTimeUnit.toLowerCase()
        baseStr += ` (${offset} ${unit} ${direction} reference event)`
      }

      return baseStr
    }

    // If no calculated date but we have relative info, show that
    if (isVague) {
      const unit = event.relativeTimeUnit.toLowerCase()
      return `~${unit} ${direction} another event`
    } else if (event.relativeOffset && event.relativeTimeUnit) {
      const offset = Math.abs(event.relativeOffset)
      const unit = event.relativeTimeUnit.toLowerCase()
      return `${offset} ${unit} ${direction} another event`
    }

    return 'Relative date'
  }

  // Fallback for old format
  if (event.dateType === 'Exact' && event.exactDate) {
    return `Year ${event.exactDate}`
  } else if (event.dateType === 'Approximation' && event.exactDate) {
    return `~Year ${event.exactDate}`
  }
  return 'Date unknown'
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString()
}

async function revertToVersion(version) {
  if (confirm(`Are you sure you want to revert to version ${version}?`)) {
    try {
      await eventsStore.revertToVersion(eventId.value, version)
      await eventsStore.fetchById(eventId.value)
      await eventsStore.fetchHistory(eventId.value)
    } catch (error) {
      alert('Failed to revert to version')
    }
  }
}

watch(showHistory, async (newValue) => {
  if (newValue && eventsStore.eventHistory.length === 0) {
    await eventsStore.fetchHistory(eventId.value)
  }
})

async function fetchCharactersAlive() {
  const event = eventsStore.currentEvent
  if (!event) {
    console.log('No event loaded')
    return
  }

  // Use calculatedExactDate for relative dates, or exactDate for exact/approximation dates
  const dateToUse = event.calculatedExactDate || event.exactDate

  console.log('Event:', event.name)
  console.log('Date to use:', dateToUse)

  if (dateToUse && typeof dateToUse === 'object') {
    try {
      // Convert ExactDate to string format "year-month-day"
      const { year, month, day } = dateToUse
      const dateStr = `${year}-${month || 1}-${day || 1}`
      console.log('Fetching characters alive at:', dateStr)
      const response = await charactersStore.fetchAliveAtDate(dateStr)
      console.log('Characters alive response:', response)
      charactersAlive.value = response || []
      console.log('Characters alive set to:', charactersAlive.value)
    } catch (error) {
      console.error('Failed to fetch characters alive:', error)
      charactersAlive.value = []
    }
  } else {
    console.log('No valid date found for this event')
  }
}

async function fetchChildEvents() {
  try {
    const response = await eventsStore.fetchChildren(eventId.value)
    childEvents.value = response || []
  } catch (error) {
    console.error('Failed to fetch child events:', error)
    childEvents.value = []
  }
}

onMounted(async () => {
  await eventsStore.fetchById(eventId.value)
  await Promise.all([
    fetchCharactersAlive(),
    fetchChildEvents()
  ])
})
</script>
