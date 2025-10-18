<template>
  <div class="event-edit">
    <h1 class="text-3xl font-bold mb-6 text-one-piece-dark">
      {{ isNewEvent ? 'Create New Event' : 'Edit Event' }}
    </h1>

    <form @submit.prevent="saveEvent" class="bg-white p-8 rounded-lg shadow-lg">
      <!-- Event Name -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Event Name *</label>
        <input
          v-model="eventData.name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter event name"
        />
      </div>

      <!-- Event Type -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Event Type *</label>
        <select
          v-model="eventData.type"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
        >
          <option value="Birth">Birth</option>
          <option value="Death">Death</option>
          <option value="Fight">Fight</option>
          <option value="Event">Event</option>
          <option value="Meeting">Meeting</option>
          <option value="Discovery">Discovery</option>
        </select>
      </div>

      <!-- Description -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Description *</label>
        <textarea
          v-model="eventData.description"
          required
          rows="5"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Describe the event..."
        ></textarea>
      </div>

      <!-- Date Type -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Date Type *</label>
        <select
          v-model="eventData.dateType"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
        >
          <option value="Exact">Exact</option>
          <option value="Approximation">Approximation</option>
          <option value="Relative">Relative</option>
        </select>
      </div>

      <!-- Exact Date -->
      <div v-if="eventData.dateType !== 'Relative'" class="mb-6">
        <label class="block text-sm font-semibold mb-2">Date</label>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Year *</label>
            <input
              v-model.number="exactDateYear"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="e.g., 1500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Month (optional)</label>
            <input
              v-model.number="exactDateMonth"
              type="number"
              min="1"
              max="12"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1-12"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Day (optional)</label>
            <input
              v-model.number="exactDateDay"
              type="number"
              min="1"
              max="31"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1-31"
            />
          </div>
        </div>
      </div>

      <!-- Relative Date -->
      <div v-if="eventData.dateType === 'Relative'" class="mb-6">
        <label class="block text-sm font-semibold mb-2">Relative to Event *</label>
        <div class="relative mb-4">
          <input
            v-model="relativeEventSearch"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            placeholder="Start typing event name..."
            @input="filterEvents"
            @focus="showEventSuggestions = true"
            @blur="() => setTimeout(() => showEventSuggestions = false, 200)"
          />

          <!-- Event Suggestions Dropdown -->
          <div
            v-if="showEventSuggestions && filteredEventSuggestions.length > 0"
            class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
          >
            <button
              v-for="evt in filteredEventSuggestions"
              :key="evt._id"
              type="button"
              @mousedown.prevent="selectRelativeEvent(evt)"
              class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              <div class="font-semibold">{{ evt.name }}</div>
              <div class="text-xs text-gray-500">{{ evt.type }} - {{ evt.displayYear ? `Year ${evt.displayYear}` : 'Unknown date' }}</div>
            </button>
          </div>
        </div>

        <div v-if="selectedRelativeEvent" class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold">{{ selectedRelativeEvent.name }}</div>
              <div class="text-sm text-gray-600">{{ selectedRelativeEvent.type }} - {{ selectedRelativeEvent.displayYear ? `Year ${selectedRelativeEvent.displayYear}` : 'Unknown date' }}</div>
            </div>
            <button
              type="button"
              @click="clearRelativeEvent"
              class="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold mb-2">Offset Amount *</label>
            <input
              v-model.number="eventData.relativeOffset"
              type="number"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="e.g., 2 (negative for before)"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2">Time Unit *</label>
            <select
              v-model="eventData.relativeTimeUnit"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            >
              <option value="Minutes">Minutes</option>
              <option value="Hours">Hours</option>
              <option value="Days">Days</option>
              <option value="Weeks">Weeks</option>
              <option value="Months">Months</option>
              <option value="Years">Years</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Arc -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Arc (optional)</label>
        <div class="relative mb-4">
          <input
            v-model="arcSearch"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            placeholder="Start typing arc name..."
            @input="filterArcs"
            @focus="showArcSuggestions = true"
            @blur="() => setTimeout(() => showArcSuggestions = false, 200)"
          />

          <!-- Arc Suggestions Dropdown -->
          <div
            v-if="showArcSuggestions && filteredArcSuggestions.length > 0"
            class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
          >
            <button
              v-for="arc in filteredArcSuggestions"
              :key="arc._id"
              type="button"
              @mousedown.prevent="selectArc(arc)"
              class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              <div class="font-semibold">{{ arc.name }}</div>
              <div class="text-xs text-gray-500">Chapters {{ arc.startChapter }}-{{ arc.endChapter }}</div>
            </button>
          </div>
        </div>

        <div v-if="selectedArc" class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold">{{ selectedArc.name }}</div>
              <div class="text-sm text-gray-600">Chapters {{ selectedArc.startChapter }}-{{ selectedArc.endChapter }}</div>
            </div>
            <button
              type="button"
              @click="clearArc"
              class="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Involved Characters -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Involved Characters</label>
        <div class="relative">
          <div class="flex gap-2 mb-2">
            <input
              v-model="newCharacter"
              type="text"
              class="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="Start typing character name..."
              @keyup.enter="addCharacter"
              @input="filterCharacters"
              @focus="showCharacterSuggestions = true"
              @blur="() => setTimeout(() => showCharacterSuggestions = false, 200)"
            />
            <button
              type="button"
              @click="addCharacter"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>

          <!-- Character Suggestions Dropdown -->
          <div
            v-if="showCharacterSuggestions && filteredCharacterSuggestions.length > 0"
            class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
          >
            <button
              v-for="char in filteredCharacterSuggestions"
              :key="char._id"
              type="button"
              @mousedown.prevent="selectCharacter(char.name)"
              class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              {{ char.name }}
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-2">
          <span
            v-for="(character, index) in eventData.involvedCharacters"
            :key="index"
            class="px-3 py-1 bg-blue-100 text-blue-800 rounded flex items-center gap-2"
          >
            {{ character }}
            <button
              type="button"
              @click="removeCharacter(index)"
              class="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </span>
        </div>
      </div>

      <!-- Sources -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Sources * (At least one primary source required)</label>

        <div
          v-for="(source, index) in eventData.sources"
          :key="index"
          class="mb-4 p-4 border border-gray-200 rounded"
          :class="{ 'border-blue-400 bg-blue-50': source.isPrimary }"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <span class="font-semibold">Source {{ index + 1 }}</span>
              <label class="flex items-center gap-1 text-sm">
                <input
                  v-model="source.isPrimary"
                  type="checkbox"
                  class="rounded"
                />
                <span :class="{ 'font-semibold text-blue-600': source.isPrimary }">Primary Source</span>
              </label>
            </div>
            <button
              type="button"
              @click="removeSource(index)"
              class="text-red-500 hover:text-red-700 font-bold"
            >
              Remove
            </button>
          </div>

          <div class="mb-2">
            <label class="block text-xs text-gray-600 mb-1">Source Type *</label>
            <select
              v-model="source.sourceType"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="Chapter">Chapter</option>
              <option value="VivreCard">Vivre Card</option>
              <option value="SBS">SBS</option>
              <option value="DataBook">Data Book</option>
            </select>
          </div>

          <div class="mb-2">
            <label class="block text-xs text-gray-600 mb-1">Notes</label>
            <textarea
              v-model="source.notes"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Additional notes about this source..."
            ></textarea>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Chapter</label>
              <input
                v-model.number="source.chapter"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Page</label>
              <input
                v-model.number="source.page"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">URL</label>
              <input
                v-model="source.url"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="addSource"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Source
        </button>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mb-6 p-4 bg-red-100 text-red-700 rounded">
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <router-link
          to="/"
          class="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </router-link>
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-one-piece-primary text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {{ loading ? 'Saving...' : 'Save Event' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventsStore } from '../stores/events'
import { useCharactersStore } from '../stores/characters'
import { useArcsStore } from '../stores/arcs'

const route = useRoute()
const router = useRouter()
const eventsStore = useEventsStore()
const charactersStore = useCharactersStore()
const arcsStore = useArcsStore()

const isNewEvent = computed(() => route.name === 'event-new')
const eventId = ref(route.params.id)
const loading = ref(false)
const error = ref(null)

// Exact date components
const exactDateYear = ref(null)
const exactDateMonth = ref(null)
const exactDateDay = ref(null)

// Watch date components and update eventData.exactDate
watch([exactDateYear, exactDateMonth, exactDateDay], () => {
  if (exactDateYear.value) {
    eventData.value.exactDate = {
      year: exactDateYear.value,
      month: exactDateMonth.value || null,
      day: exactDateDay.value || null
    }
  } else {
    eventData.value.exactDate = null
  }
})

const eventData = ref({
  name: '',
  type: 'Event',
  description: '',
  dateType: 'Exact',
  exactDate: null,
  relativeEventId: null,
  relativeOffset: null,
  relativeTimeUnit: 'Days',
  arcId: null,
  involvedCharacters: [],
  sources: [{ sourceType: 'Chapter', notes: '', isPrimary: true, chapter: null, page: null, url: '' }],
})

// Character autocomplete
const newCharacter = ref('')
const showCharacterSuggestions = ref(false)
const filteredCharacterSuggestions = ref([])

function filterCharacters() {
  if (!newCharacter.value.trim()) {
    filteredCharacterSuggestions.value = []
    return
  }

  const search = newCharacter.value.toLowerCase()
  filteredCharacterSuggestions.value = charactersStore.sortedCharacters
    .filter(char =>
      char.name.toLowerCase().includes(search) &&
      !eventData.value.involvedCharacters.includes(char.name)
    )
    .slice(0, 10)
}

async function selectCharacter(name) {
  if (!eventData.value.involvedCharacters.includes(name)) {
    eventData.value.involvedCharacters.push(name)
  }
  newCharacter.value = ''
  showCharacterSuggestions.value = false
  filteredCharacterSuggestions.value = []
}

async function addCharacter() {
  const charName = newCharacter.value.trim()
  if (!charName || eventData.value.involvedCharacters.includes(charName)) {
    return
  }

  // Check if character exists, if not create it
  const existingChar = charactersStore.sortedCharacters.find(c => c.name === charName)
  if (!existingChar) {
    try {
      await charactersStore.create({ name: charName })
    } catch (err) {
      console.error('Failed to create character:', err)
    }
  }

  eventData.value.involvedCharacters.push(charName)
  newCharacter.value = ''
  showCharacterSuggestions.value = false
  filteredCharacterSuggestions.value = []
}

function removeCharacter(index) {
  eventData.value.involvedCharacters.splice(index, 1)
}

// Event autocomplete for relative dates
const relativeEventSearch = ref('')
const showEventSuggestions = ref(false)
const filteredEventSuggestions = ref([])
const selectedRelativeEvent = ref(null)

function filterEvents() {
  if (!relativeEventSearch.value.trim()) {
    filteredEventSuggestions.value = []
    return
  }

  const search = relativeEventSearch.value.toLowerCase()
  filteredEventSuggestions.value = eventsStore.sortedEvents
    .filter(evt =>
      evt._id !== eventId.value && // Don't show current event
      evt.name.toLowerCase().includes(search)
    )
    .slice(0, 10)
}

function selectRelativeEvent(event) {
  selectedRelativeEvent.value = event
  eventData.value.relativeEventId = event._id
  relativeEventSearch.value = event.name
  showEventSuggestions.value = false
  filteredEventSuggestions.value = []
}

function clearRelativeEvent() {
  selectedRelativeEvent.value = null
  eventData.value.relativeEventId = null
  relativeEventSearch.value = ''
}

// Arc autocomplete
const arcSearch = ref('')
const showArcSuggestions = ref(false)
const filteredArcSuggestions = ref([])
const selectedArc = ref(null)

function filterArcs() {
  if (!arcSearch.value.trim()) {
    filteredArcSuggestions.value = []
    return
  }

  const search = arcSearch.value.toLowerCase()
  filteredArcSuggestions.value = arcsStore.sortedArcs
    .filter(arc => arc.name.toLowerCase().includes(search))
    .slice(0, 10)
}

function selectArc(arc) {
  selectedArc.value = arc
  eventData.value.arcId = arc._id
  arcSearch.value = arc.name
  showArcSuggestions.value = false
  filteredArcSuggestions.value = []
}

function clearArc() {
  selectedArc.value = null
  eventData.value.arcId = null
  arcSearch.value = ''
}

function addSource() {
  eventData.value.sources.push({ sourceType: 'Chapter', notes: '', isPrimary: false, chapter: null, page: null, url: '' })
}

function removeSource(index) {
  if (eventData.value.sources.length > 1) {
    eventData.value.sources.splice(index, 1)
  }
}

async function saveEvent() {
  // Validate sources - must have at least one source with a type
  const validSources = eventData.value.sources.filter(s => s.sourceType)
  if (validSources.length === 0) {
    error.value = 'At least one source is required'
    return
  }

  // Ensure at least one source is marked as primary
  const hasPrimary = validSources.some(s => s.isPrimary)
  if (!hasPrimary) {
    error.value = 'At least one source must be marked as primary'
    return
  }

  loading.value = true
  error.value = null

  try {
    if (isNewEvent.value) {
      await eventsStore.create({ ...eventData.value, sources: validSources })
    } else {
      await eventsStore.update(eventId.value, { ...eventData.value, sources: validSources })
    }
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save event'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Load all characters, events, and arcs for autocomplete
  await Promise.all([
    charactersStore.fetchAll(),
    eventsStore.fetchAll(),
    arcsStore.fetchAll()
  ])

  if (!isNewEvent.value && eventId.value) {
    await eventsStore.fetchById(eventId.value)
    if (eventsStore.currentEvent) {
      eventData.value = { ...eventsStore.currentEvent }

      // Handle exact date - extract year, month, day
      if (eventData.value.exactDate) {
        exactDateYear.value = eventData.value.exactDate.year || null
        exactDateMonth.value = eventData.value.exactDate.month || null
        exactDateDay.value = eventData.value.exactDate.day || null
      }

      // Ensure sources have proper structure
      if (eventData.value.sources.length === 0) {
        eventData.value.sources = [{ sourceType: 'Chapter', notes: '', isPrimary: true, chapter: null, page: null, url: '' }]
      }

      // Load selected relative event if exists
      if (eventData.value.relativeEventId) {
        const relEvent = eventsStore.sortedEvents.find(e => e._id === eventData.value.relativeEventId)
        if (relEvent) {
          selectedRelativeEvent.value = relEvent
          relativeEventSearch.value = relEvent.name
        }
      }

      // Load selected arc if exists
      if (eventData.value.arcId) {
        const arc = arcsStore.sortedArcs.find(a => a._id === eventData.value.arcId)
        if (arc) {
          selectedArc.value = arc
          arcSearch.value = arc.name
        }
      }
    }
  }
})

// Click outside to close dropdowns - handled via blur instead
</script>
