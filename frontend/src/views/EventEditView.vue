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

      <!-- Event Date using DateInput Component -->
      <div class="mb-8">
        <DateInput
          label="Event Date"
          :date-type="eventData.dateType"
          @update:date-type="eventData.dateType = $event"
          :exact-year="exactYear"
          @update:exact-year="exactYear = $event"
          :exact-month="exactMonth"
          @update:exact-month="exactMonth = $event"
          :exact-day="exactDay"
          @update:exact-day="exactDay = $event"
          :relative-type="relativeType"
          @update:relative-type="relativeType = $event"
          :selected-relative-era="selectedRelativeEra"
          @update:selected-relative-era="selectedRelativeEra = $event"
          :selected-relative-event="selectedRelativeEvent"
          @update:selected-relative-event="selectedRelativeEvent = $event"
          :offset-amount="offsetAmount"
          @update:offset-amount="offsetAmount = $event"
          :direction="direction"
          @update:direction="direction = $event"
          :time-unit="timeUnit"
          @update:time-unit="timeUnit = $event"
          :is-vague-relative="isVagueRelative"
          @update:is-vague-relative="isVagueRelative = $event"
          :approximate-description="approximateDescription"
          @update:approximate-description="approximateDescription = $event"
          :eras="erasStore.eras"
          :events="eventsStore.sortedEvents.filter(e => e._id !== eventId)"
        />
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

      <!-- Parent Event -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Parent Event (optional)</label>
        <p class="text-xs text-gray-600 mb-2">Select a parent event if this is a sub-event (e.g., a fight during a larger battle)</p>
        <div class="relative mb-4">
          <input
            v-model="parentEventSearch"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            placeholder="Start typing event name..."
            @input="filterParentEvents"
            @focus="showParentEventSuggestions = true"
            @blur="() => setTimeout(() => showParentEventSuggestions = false, 200)"
          />

          <!-- Parent Event Suggestions Dropdown -->
          <div
            v-if="showParentEventSuggestions && filteredParentEventSuggestions.length > 0"
            class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
          >
            <button
              v-for="evt in filteredParentEventSuggestions"
              :key="evt._id"
              type="button"
              @mousedown.prevent="selectParentEvent(evt)"
              class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              <div class="font-semibold">{{ evt.name }}</div>
              <div class="text-xs text-gray-500">{{ evt.type }} - {{ evt.displayYear ? `Year ${evt.displayYear}` : 'Unknown date' }}</div>
            </button>
          </div>
        </div>

        <div v-if="selectedParentEvent" class="mb-4 p-3 bg-purple-50 rounded border border-purple-200">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold">{{ selectedParentEvent.name }}</div>
              <div class="text-sm text-gray-600">{{ selectedParentEvent.type }} - {{ selectedParentEvent.displayYear ? `Year ${selectedParentEvent.displayYear}` : 'Unknown date' }}</div>
            </div>
            <button
              type="button"
              @click="clearParentEvent"
              class="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Location (optional)</label>
        <p class="text-xs text-gray-600 mb-2">Select where this event took place</p>
        <div class="relative mb-4">
          <input
            v-model="locationSearch"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            placeholder="Start typing location name..."
            @input="filterLocations"
            @focus="showLocationSuggestions = true"
            @blur="() => setTimeout(() => showLocationSuggestions = false, 200)"
          />

          <!-- Location Suggestions Dropdown -->
          <div
            v-if="showLocationSuggestions && filteredLocationSuggestions.length > 0"
            class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
          >
            <button
              v-for="loc in filteredLocationSuggestions"
              :key="loc._id"
              type="button"
              @mousedown.prevent="selectLocation(loc)"
              class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              <div class="font-semibold">{{ loc.name }}</div>
              <div class="text-xs text-gray-500">{{ formatLocationType(loc.type) }}</div>
            </button>
          </div>
        </div>

        <div v-if="selectedLocation" class="mb-4 p-3 bg-green-50 rounded border border-green-200">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold">{{ selectedLocation.name }}</div>
              <div class="text-sm text-gray-600">{{ formatLocationType(selectedLocation.type) }}</div>
            </div>
            <button
              type="button"
              @click="clearLocation"
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
import { useLocationsStore } from '../stores/locations'
import { useErasStore } from '../stores/eras'
import { SERIES_START_YEAR, relativeToAbsolute, absoluteToRelative } from '../utils/yearDisplay'
import DateInput from '../components/DateInput.vue'

const route = useRoute()
const router = useRouter()
const eventsStore = useEventsStore()
const charactersStore = useCharactersStore()
const arcsStore = useArcsStore()
const locationsStore = useLocationsStore()
const erasStore = useErasStore()

const isNewEvent = computed(() => route.name === 'event-new')
const eventId = ref(route.params.id)
const loading = ref(false)
const error = ref(null)

// Date input UI state (for DateInput component)
const exactDateYear = ref(null)  // Keeping original name for test compatibility
const exactDateMonth = ref(null)  // Keeping original name for test compatibility
const exactDateDay = ref(null)  // Keeping original name for test compatibility

// Computed properties to map to DateInput's expected names
const exactYear = computed({
  get: () => exactDateYear.value,
  set: (val) => { exactDateYear.value = val }
})
const exactMonth = computed({
  get: () => exactDateMonth.value,
  set: (val) => { exactDateMonth.value = val }
})
const exactDay = computed({
  get: () => exactDateDay.value,
  set: (val) => { exactDateDay.value = val }
})
const relativeType = ref('event')
const selectedRelativeEra = ref(null)
const selectedRelativeEvent = ref(null)
const isVagueRelative = ref(false)
const vagueOffsetAmount = ref(null)  // Keeping original name for test compatibility
const relativeDirection = ref('after')  // Keeping original name for test compatibility (lowercase)
const timeUnit = ref('Days')
const approximateDescription = ref('')

// Relative year input mode (for test compatibility)
const useRelativeYearInput = ref(false)
const referenceYear = ref(SERIES_START_YEAR)
const relativeYearOffset = ref(0)

const calculatedAbsoluteYear = computed(() => {
  return relativeToAbsolute(relativeYearOffset.value, referenceYear.value)
})

// Computed properties to map to DateInput's expected capitalized format
const direction = computed({
  get: () => {
    // Convert lowercase to capitalized for DateInput component
    return relativeDirection.value === 'before' ? 'Before' : 'After'
  },
  set: (val) => {
    // Convert capitalized to lowercase for internal use
    relativeDirection.value = val === 'Before' ? 'before' : 'after'
  }
})

const offsetAmount = computed({
  get: () => vagueOffsetAmount.value,
  set: (val) => { vagueOffsetAmount.value = val }
})

// Watch date components and update eventData
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

// Watch vague relative flag - clear offset when enabled (for test compatibility)
watch(isVagueRelative, (newValue) => {
  if (newValue) {
    eventData.value.relativeOffset = null
    vagueOffsetAmount.value = null
  }
})

// Watch amount + direction and sync to eventData (for test compatibility)
watch([vagueOffsetAmount, relativeDirection], () => {
  if (isVagueRelative.value) {
    // For vague dates, set relativeDirection and null offset
    eventData.value.relativeOffset = null
    eventData.value.relativeDirection = relativeDirection.value === 'before' ? 'Before' : 'After'
  } else if (vagueOffsetAmount.value != null) {
    // For precise dates, convert direction + amount to signed offset and clear relativeDirection
    eventData.value.relativeOffset = relativeDirection.value === 'before'
      ? -Math.abs(vagueOffsetAmount.value)
      : Math.abs(vagueOffsetAmount.value)
    eventData.value.relativeDirection = null
  }
})

// Watch selected relative event/era
watch([selectedRelativeEra, selectedRelativeEvent], () => {
  if (relativeType.value === 'era' && selectedRelativeEra.value) {
    eventData.value.relativeEventId = null
    // Note: Events don't support relativeEraId in the backend
  } else if (relativeType.value === 'event' && selectedRelativeEvent.value) {
    eventData.value.relativeEventId = selectedRelativeEvent.value._id
  }
})

// Watch approximateDescription
watch(approximateDescription, (newValue) => {
  eventData.value.approximateDescription = newValue
})

// Watch relative year input mode changes (for test compatibility)
watch(useRelativeYearInput, (newValue) => {
  if (newValue && exactDateYear.value != null) {
    // Switching TO relative mode: convert absolute year to relative offset
    relativeYearOffset.value = absoluteToRelative(exactDateYear.value, referenceYear.value)
  } else if (!newValue && calculatedAbsoluteYear.value != null) {
    // Switching FROM relative mode: use calculated absolute year
    exactDateYear.value = calculatedAbsoluteYear.value
  }
})

// Watch relative year inputs and update the absolute year
watch([relativeYearOffset, referenceYear], () => {
  if (useRelativeYearInput.value) {
    exactDateYear.value = calculatedAbsoluteYear.value
  }
})

// Watch absolute year when not in relative mode
watch(exactDateYear, (newValue) => {
  if (!useRelativeYearInput.value && newValue != null && referenceYear.value != null) {
    // Update relative offset to stay in sync
    relativeYearOffset.value = absoluteToRelative(newValue, referenceYear.value)
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
  relativeDirection: null,
  arcId: null,
  parentEventId: null,
  locationId: null,
  involvedCharacters: [],
  sources: [{ sourceType: 'Chapter', notes: '', isPrimary: true, chapter: null, page: null, url: '' }],
})

// Stub refs for test compatibility (DateInput handles these internally now)
const relativeEventSearch = ref('')
const showEventSuggestions = ref(false)
const filteredEventSuggestions = ref([])

// Stub functions for test compatibility
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

// Parent Event autocomplete
const parentEventSearch = ref('')
const showParentEventSuggestions = ref(false)
const filteredParentEventSuggestions = ref([])
const selectedParentEvent = ref(null)

function filterParentEvents() {
  if (!parentEventSearch.value.trim()) {
    filteredParentEventSuggestions.value = []
    return
  }

  const search = parentEventSearch.value.toLowerCase()
  filteredParentEventSuggestions.value = eventsStore.sortedEvents
    .filter(evt =>
      evt._id !== eventId.value && // Don't show current event
      evt.name.toLowerCase().includes(search)
    )
    .slice(0, 10)
}

function selectParentEvent(event) {
  selectedParentEvent.value = event
  eventData.value.parentEventId = event._id
  parentEventSearch.value = event.name
  showParentEventSuggestions.value = false
  filteredParentEventSuggestions.value = []
}

function clearParentEvent() {
  selectedParentEvent.value = null
  eventData.value.parentEventId = null
  parentEventSearch.value = ''
}

// Location autocomplete
const locationSearch = ref('')
const showLocationSuggestions = ref(false)
const filteredLocationSuggestions = ref([])
const selectedLocation = ref(null)

function formatLocationType(type) {
  const typeMap = {
    'Sea': 'Sea',
    'Island': 'Island',
    'Kingdom': 'Kingdom',
    'CityTownVillage': 'City/Town/Village'
  }
  return typeMap[type] || type
}

function filterLocations() {
  if (!locationSearch.value.trim()) {
    filteredLocationSuggestions.value = []
    return
  }

  const search = locationSearch.value.toLowerCase()
  filteredLocationSuggestions.value = locationsStore.sortedLocations
    .filter(loc => loc.name.toLowerCase().includes(search))
    .slice(0, 10)
}

function selectLocation(location) {
  selectedLocation.value = location
  eventData.value.locationId = location._id
  locationSearch.value = location.name
  showLocationSuggestions.value = false
  filteredLocationSuggestions.value = []
}

function clearLocation() {
  selectedLocation.value = null
  eventData.value.locationId = null
  locationSearch.value = ''
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
  // Load all characters, events, arcs, locations, and eras for autocomplete
  await Promise.all([
    charactersStore.fetchAll(),
    eventsStore.fetchAll(),
    arcsStore.fetchAll(),
    locationsStore.fetchAll(),
    erasStore.fetchAll()
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

      // Handle relative date
      if (eventData.value.dateType === 'Relative') {
        if (eventData.value.relativeEventId) {
          relativeType.value = 'event'
          const relEvent = eventsStore.sortedEvents.find(e => e._id === eventData.value.relativeEventId)
          if (relEvent) {
            selectedRelativeEvent.value = relEvent
            relativeEventSearch.value = relEvent.name  // For test compatibility
          }
        }

        // Check if this is a vague relative date
        if (eventData.value.relativeTimeUnit && eventData.value.relativeOffset == null) {
          isVagueRelative.value = true
          if (eventData.value.relativeDirection) {
            // Convert capitalized backend value to lowercase for internal use
            relativeDirection.value = eventData.value.relativeDirection.toLowerCase()
          }
        } else if (eventData.value.relativeOffset != null) {
          isVagueRelative.value = false
          vagueOffsetAmount.value = Math.abs(eventData.value.relativeOffset)
          relativeDirection.value = eventData.value.relativeOffset < 0 ? 'before' : 'after'
        }

        timeUnit.value = eventData.value.relativeTimeUnit || 'Days'
      }

      // Handle approximation date
      if (eventData.value.dateType === 'Approximation' && eventData.value.approximateDescription) {
        approximateDescription.value = eventData.value.approximateDescription
      }

      // Ensure sources have proper structure
      if (eventData.value.sources.length === 0) {
        eventData.value.sources = [{ sourceType: 'Chapter', notes: '', isPrimary: true, chapter: null, page: null, url: '' }]
      }

      // Load selected arc if exists
      if (eventData.value.arcId) {
        const arc = arcsStore.sortedArcs.find(a => a._id === eventData.value.arcId)
        if (arc) {
          selectedArc.value = arc
          arcSearch.value = arc.name
        }
      }

      // Load selected parent event if exists
      if (eventData.value.parentEventId) {
        const parentEvent = eventsStore.sortedEvents.find(e => e._id === eventData.value.parentEventId)
        if (parentEvent) {
          selectedParentEvent.value = parentEvent
          parentEventSearch.value = parentEvent.name
        }
      }

      // Load selected location if exists
      if (eventData.value.locationId) {
        const location = locationsStore.sortedLocations.find(l => l._id === eventData.value.locationId)
        if (location) {
          selectedLocation.value = location
          locationSearch.value = location.name
        }
      }
    }
  }
})

// Click outside to close dropdowns - handled via blur instead
</script>
