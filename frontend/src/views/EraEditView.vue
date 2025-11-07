<template>
  <div class="era-edit-view max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-one-piece-dark">
      {{ isNewEra ? 'Create New Era' : 'Edit Era' }}
    </h1>

    <!-- Loading State -->
    <div v-if="erasStore.loading || eventsStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="erasStore.error" class="bg-red-100 p-4 rounded text-red-700 mb-4">
      {{ erasStore.error }}
    </div>

    <!-- Era Form -->
    <form v-else @submit.prevent="saveEra" class="bg-white p-6 rounded-lg shadow">
      <!-- Name -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Name *</label>
        <input
          v-model="eraData.name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter era name"
        />
      </div>

      <!-- Description -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Description</label>
        <textarea
          v-model="eraData.description"
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter era description"
        ></textarea>
      </div>

      <!-- START DATE SECTION -->
      <div class="mb-8 p-4 border border-gray-200 rounded">
        <h2 class="text-xl font-semibold mb-4">Start Date</h2>

        <!-- Start Date Type -->
        <div class="mb-4">
          <label class="block text-sm font-semibold mb-2">Date Type *</label>
          <select
            v-model="eraData.startDateType"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          >
            <option value="Exact">Exact</option>
            <option value="Approximation">Approximation</option>
            <option value="Relative">Relative</option>
          </select>
        </div>

        <!-- Exact Start Date -->
        <div v-if="eraData.startDateType === 'Exact'" class="mb-4">
          <label class="block text-sm font-semibold mb-2">Date</label>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Year *</label>
              <input
                v-model.number="startExactYear"
                type="number"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="1500"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Month (1-12)</label>
              <input
                v-model.number="startExactMonth"
                type="number"
                min="1"
                max="12"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="1"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Day (1-31)</label>
              <input
                v-model.number="startExactDay"
                type="number"
                min="1"
                max="31"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="1"
              />
            </div>
          </div>
        </div>

        <!-- Relative Start Date -->
        <div v-if="eraData.startDateType === 'Relative'" class="mb-4">
          <label class="block text-sm font-semibold mb-2">Reference Type *</label>
          <select
            v-model="startRelativeType"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary mb-4"
          >
            <option value="era">Relative to Era</option>
            <option value="event">Relative to Event</option>
          </select>

          <!-- Search for Era -->
          <div v-if="startRelativeType === 'era'" class="relative mb-4">
            <label class="block text-sm font-semibold mb-2">Select Era *</label>
            <input
              v-model="startRelativeEraSearch"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="Start typing era name..."
              @input="filterStartEras"
              @focus="showStartEraSuggestions = true"
              @blur="() => setTimeout(() => showStartEraSuggestions = false, 200)"
            />

            <div
              v-if="showStartEraSuggestions && filteredStartEraSuggestions.length > 0"
              class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
            >
              <button
                v-for="era in filteredStartEraSuggestions"
                :key="era._id"
                type="button"
                @mousedown.prevent="selectStartRelativeEra(era)"
                class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <div class="font-semibold">{{ era.name }}</div>
                <div class="text-xs text-gray-500">{{ era.startDisplayYear ? `Starts: Year ${era.startDisplayYear}` : 'Unknown date' }}</div>
              </button>
            </div>
          </div>

          <!-- Search for Event -->
          <div v-if="startRelativeType === 'event'" class="relative mb-4">
            <label class="block text-sm font-semibold mb-2">Select Event *</label>
            <input
              v-model="startRelativeEventSearch"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="Start typing event name..."
              @input="filterStartEvents"
              @focus="showStartEventSuggestions = true"
              @blur="() => setTimeout(() => showStartEventSuggestions = false, 200)"
            />

            <div
              v-if="showStartEventSuggestions && filteredStartEventSuggestions.length > 0"
              class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
            >
              <button
                v-for="evt in filteredStartEventSuggestions"
                :key="evt._id"
                type="button"
                @mousedown.prevent="selectStartRelativeEvent(evt)"
                class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <div class="font-semibold">{{ evt.name }}</div>
                <div class="text-xs text-gray-500">{{ evt.type }} - {{ evt.displayYear ? `Year ${evt.displayYear}` : 'Unknown date' }}</div>
              </button>
            </div>
          </div>

          <!-- Selected Reference Display -->
          <div v-if="selectedStartRelativeEra || selectedStartRelativeEvent" class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-semibold">{{ selectedStartRelativeEra?.name || selectedStartRelativeEvent?.name }}</div>
                <div class="text-sm text-gray-600">
                  <span v-if="selectedStartRelativeEra">Era - Starts: Year {{ selectedStartRelativeEra.startDisplayYear || 'Unknown' }}</span>
                  <span v-if="selectedStartRelativeEvent">{{ selectedStartRelativeEvent.type }} - Year {{ selectedStartRelativeEvent.displayYear || 'Unknown' }}</span>
                </div>
              </div>
              <button
                type="button"
                @click="clearStartRelative"
                class="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Vague Relative Checkbox -->
          <div class="mb-3">
            <label class="flex items-center gap-2">
              <input
                v-model="startIsVagueRelative"
                type="checkbox"
                class="rounded"
              />
              <span class="text-sm font-semibold">Vague offset (e.g., "some days after" without exact count)</span>
            </label>
          </div>

          <!-- Offset Configuration -->
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-2">
                Offset Amount {{ startIsVagueRelative ? '(optional)' : '*' }}
              </label>
              <input
                v-model.number="startOffsetAmount"
                type="number"
                :required="!startIsVagueRelative"
                :disabled="startIsVagueRelative"
                min="0"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary disabled:bg-gray-100"
                :placeholder="startIsVagueRelative ? 'N/A' : 'e.g., 2'"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-2">Direction *</label>
              <select
                v-model="startDirection"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              >
                <option value="Before">Before</option>
                <option value="After">After</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-2">Time Unit *</label>
              <select
                v-model="startTimeUnit"
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

        <!-- Approximation Start Date -->
        <div v-if="eraData.startDateType === 'Approximation'" class="mb-4">
          <label class="block text-sm font-semibold mb-2">Approximate Description *</label>
          <input
            v-model="startApproximateDescription"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            placeholder="e.g., During the Void Century"
          />
        </div>
      </div>

      <!-- END DATE SECTION -->
      <div class="mb-8 p-4 border border-gray-200 rounded">
        <h2 class="text-xl font-semibold mb-4">End Date</h2>

        <!-- End Date Type -->
        <div class="mb-4">
          <label class="block text-sm font-semibold mb-2">Date Type *</label>
          <select
            v-model="eraData.endDateType"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          >
            <option value="Exact">Exact</option>
            <option value="Approximation">Approximation</option>
            <option value="Relative">Relative</option>
          </select>
        </div>

        <!-- Exact End Date -->
        <div v-if="eraData.endDateType === 'Exact'" class="mb-4">
          <label class="block text-sm font-semibold mb-2">Date</label>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Year *</label>
              <input
                v-model.number="endExactYear"
                type="number"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="1550"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Month (1-12)</label>
              <input
                v-model.number="endExactMonth"
                type="number"
                min="1"
                max="12"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="12"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Day (1-31)</label>
              <input
                v-model.number="endExactDay"
                type="number"
                min="1"
                max="31"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="31"
              />
            </div>
          </div>
        </div>

        <!-- Relative End Date -->
        <div v-if="eraData.endDateType === 'Relative'" class="mb-4">
          <label class="block text-sm font-semibold mb-2">Reference Type *</label>
          <select
            v-model="endRelativeType"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary mb-4"
          >
            <option value="era">Relative to Era</option>
            <option value="event">Relative to Event</option>
          </select>

          <!-- Search for Era -->
          <div v-if="endRelativeType === 'era'" class="relative mb-4">
            <label class="block text-sm font-semibold mb-2">Select Era *</label>
            <input
              v-model="endRelativeEraSearch"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="Start typing era name..."
              @input="filterEndEras"
              @focus="showEndEraSuggestions = true"
              @blur="() => setTimeout(() => showEndEraSuggestions = false, 200)"
            />

            <div
              v-if="showEndEraSuggestions && filteredEndEraSuggestions.length > 0"
              class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
            >
              <button
                v-for="era in filteredEndEraSuggestions"
                :key="era._id"
                type="button"
                @mousedown.prevent="selectEndRelativeEra(era)"
                class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <div class="font-semibold">{{ era.name }}</div>
                <div class="text-xs text-gray-500">{{ era.endDisplayYear ? `Ends: Year ${era.endDisplayYear}` : 'Unknown date' }}</div>
              </button>
            </div>
          </div>

          <!-- Search for Event -->
          <div v-if="endRelativeType === 'event'" class="relative mb-4">
            <label class="block text-sm font-semibold mb-2">Select Event *</label>
            <input
              v-model="endRelativeEventSearch"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="Start typing event name..."
              @input="filterEndEvents"
              @focus="showEndEventSuggestions = true"
              @blur="() => setTimeout(() => showEndEventSuggestions = false, 200)"
            />

            <div
              v-if="showEndEventSuggestions && filteredEndEventSuggestions.length > 0"
              class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
            >
              <button
                v-for="evt in filteredEndEventSuggestions"
                :key="evt._id"
                type="button"
                @mousedown.prevent="selectEndRelativeEvent(evt)"
                class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <div class="font-semibold">{{ evt.name }}</div>
                <div class="text-xs text-gray-500">{{ evt.type }} - {{ evt.displayYear ? `Year ${evt.displayYear}` : 'Unknown date' }}</div>
              </button>
            </div>
          </div>

          <!-- Selected Reference Display -->
          <div v-if="selectedEndRelativeEra || selectedEndRelativeEvent" class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-semibold">{{ selectedEndRelativeEra?.name || selectedEndRelativeEvent?.name }}</div>
                <div class="text-sm text-gray-600">
                  <span v-if="selectedEndRelativeEra">Era - Ends: Year {{ selectedEndRelativeEra.endDisplayYear || 'Unknown' }}</span>
                  <span v-if="selectedEndRelativeEvent">{{ selectedEndRelativeEvent.type }} - Year {{ selectedEndRelativeEvent.displayYear || 'Unknown' }}</span>
                </div>
              </div>
              <button
                type="button"
                @click="clearEndRelative"
                class="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Vague Relative Checkbox -->
          <div class="mb-3">
            <label class="flex items-center gap-2">
              <input
                v-model="endIsVagueRelative"
                type="checkbox"
                class="rounded"
              />
              <span class="text-sm font-semibold">Vague offset (e.g., "some days after" without exact count)</span>
            </label>
          </div>

          <!-- Offset Configuration -->
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-2">
                Offset Amount {{ endIsVagueRelative ? '(optional)' : '*' }}
              </label>
              <input
                v-model.number="endOffsetAmount"
                type="number"
                :required="!endIsVagueRelative"
                :disabled="endIsVagueRelative"
                min="0"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary disabled:bg-gray-100"
                :placeholder="endIsVagueRelative ? 'N/A' : 'e.g., 2'"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-2">Direction *</label>
              <select
                v-model="endDirection"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              >
                <option value="Before">Before</option>
                <option value="After">After</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-2">Time Unit *</label>
              <select
                v-model="endTimeUnit"
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

        <!-- Approximation End Date -->
        <div v-if="eraData.endDateType === 'Approximation'" class="mb-4">
          <label class="block text-sm font-semibold mb-2">Approximate Description *</label>
          <input
            v-model="endApproximateDescription"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            placeholder="e.g., End of the Void Century"
          />
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-4">
        <button
          type="submit"
          class="px-6 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
        >
          {{ isNewEra ? 'Create Era' : 'Save Changes' }}
        </button>
        <router-link
          to="/eras"
          class="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useErasStore } from '../stores/eras'
import { useEventsStore } from '../stores/events'

const route = useRoute()
const router = useRouter()
const erasStore = useErasStore()
const eventsStore = useEventsStore()

const eraId = computed(() => route.params.id)
const isNewEra = computed(() => !eraId.value || eraId.value === 'new')

const eraData = ref({
  name: '',
  description: '',
  startDateType: 'Exact',
  endDateType: 'Exact',
})

// Start date UI state
const startExactYear = ref(null)
const startExactMonth = ref(null)
const startExactDay = ref(null)
const startRelativeType = ref('era') // 'era' or 'event'
const startRelativeEraSearch = ref('')
const startRelativeEventSearch = ref('')
const showStartEraSuggestions = ref(false)
const showStartEventSuggestions = ref(false)
const selectedStartRelativeEra = ref(null)
const selectedStartRelativeEvent = ref(null)
const filteredStartEraSuggestions = ref([])
const filteredStartEventSuggestions = ref([])
const startIsVagueRelative = ref(false)
const startOffsetAmount = ref(null)
const startDirection = ref('After')
const startTimeUnit = ref('Days')
const startApproximateDescription = ref('')

// End date UI state
const endExactYear = ref(null)
const endExactMonth = ref(null)
const endExactDay = ref(null)
const endRelativeType = ref('era') // 'era' or 'event'
const endRelativeEraSearch = ref('')
const endRelativeEventSearch = ref('')
const showEndEraSuggestions = ref(false)
const showEndEventSuggestions = ref(false)
const selectedEndRelativeEra = ref(null)
const selectedEndRelativeEvent = ref(null)
const filteredEndEraSuggestions = ref([])
const filteredEndEventSuggestions = ref([])
const endIsVagueRelative = ref(false)
const endOffsetAmount = ref(null)
const endDirection = ref('After')
const endTimeUnit = ref('Days')
const endApproximateDescription = ref('')

// Filter functions for start date
function filterStartEras() {
  const query = startRelativeEraSearch.value.toLowerCase()
  filteredStartEraSuggestions.value = erasStore.eras
    .filter(era => era._id !== eraId.value && era.name.toLowerCase().includes(query))
    .slice(0, 10)
}

function filterStartEvents() {
  const query = startRelativeEventSearch.value.toLowerCase()
  filteredStartEventSuggestions.value = eventsStore.events
    .filter(evt => evt.name.toLowerCase().includes(query))
    .slice(0, 10)
}

function selectStartRelativeEra(era) {
  selectedStartRelativeEra.value = era
  selectedStartRelativeEvent.value = null
  startRelativeEraSearch.value = era.name
  showStartEraSuggestions.value = false
}

function selectStartRelativeEvent(evt) {
  selectedStartRelativeEvent.value = evt
  selectedStartRelativeEra.value = null
  startRelativeEventSearch.value = evt.name
  showStartEventSuggestions.value = false
}

function clearStartRelative() {
  selectedStartRelativeEra.value = null
  selectedStartRelativeEvent.value = null
  startRelativeEraSearch.value = ''
  startRelativeEventSearch.value = ''
}

// Filter functions for end date
function filterEndEras() {
  const query = endRelativeEraSearch.value.toLowerCase()
  filteredEndEraSuggestions.value = erasStore.eras
    .filter(era => era._id !== eraId.value && era.name.toLowerCase().includes(query))
    .slice(0, 10)
}

function filterEndEvents() {
  const query = endRelativeEventSearch.value.toLowerCase()
  filteredEndEventSuggestions.value = eventsStore.events
    .filter(evt => evt.name.toLowerCase().includes(query))
    .slice(0, 10)
}

function selectEndRelativeEra(era) {
  selectedEndRelativeEra.value = era
  selectedEndRelativeEvent.value = null
  endRelativeEraSearch.value = era.name
  showEndEraSuggestions.value = false
}

function selectEndRelativeEvent(evt) {
  selectedEndRelativeEvent.value = evt
  selectedEndRelativeEra.value = null
  endRelativeEventSearch.value = evt.name
  showEndEventSuggestions.value = false
}

function clearEndRelative() {
  selectedEndRelativeEra.value = null
  selectedEndRelativeEvent.value = null
  endRelativeEraSearch.value = ''
  endRelativeEventSearch.value = ''
}

// Convert UI state to backend format
function buildEraPayload() {
  const payload = {
    name: eraData.value.name,
    startDateType: eraData.value.startDateType,
    endDateType: eraData.value.endDateType,
  }

  if (eraData.value.description) {
    payload.description = eraData.value.description
  }

  // Start date
  if (eraData.value.startDateType === 'Exact') {
    if (!startExactYear.value) {
      throw new Error('Start year is required for exact dates')
    }
    payload.startDate = { year: startExactYear.value }
    if (startExactMonth.value) payload.startDate.month = startExactMonth.value
    if (startExactDay.value) payload.startDate.day = startExactDay.value
  } else if (eraData.value.startDateType === 'Relative') {
    if (startRelativeType.value === 'era' && selectedStartRelativeEra.value) {
      payload.startRelativeEraId = selectedStartRelativeEra.value._id
    } else if (startRelativeType.value === 'event' && selectedStartRelativeEvent.value) {
      payload.startRelativeEventId = selectedStartRelativeEvent.value._id
    } else {
      throw new Error('Please select a reference for the start date')
    }

    if (!startIsVagueRelative.value && !startOffsetAmount.value) {
      throw new Error('Start offset amount is required for non-vague relative dates')
    }

    if (startIsVagueRelative.value) {
      payload.startRelativeDirection = startDirection.value
    } else {
      const signedOffset = startDirection.value === 'Before' ? -startOffsetAmount.value : startOffsetAmount.value
      payload.startRelativeOffset = signedOffset
    }
    payload.startRelativeTimeUnit = startTimeUnit.value
  } else if (eraData.value.startDateType === 'Approximation') {
    if (!startApproximateDescription.value) {
      throw new Error('Start approximate description is required')
    }
    payload.startApproximateDescription = startApproximateDescription.value
  }

  // End date
  if (eraData.value.endDateType === 'Exact') {
    if (!endExactYear.value) {
      throw new Error('End year is required for exact dates')
    }
    payload.endDate = { year: endExactYear.value }
    if (endExactMonth.value) payload.endDate.month = endExactMonth.value
    if (endExactDay.value) payload.endDate.day = endExactDay.value
  } else if (eraData.value.endDateType === 'Relative') {
    if (endRelativeType.value === 'era' && selectedEndRelativeEra.value) {
      payload.endRelativeEraId = selectedEndRelativeEra.value._id
    } else if (endRelativeType.value === 'event' && selectedEndRelativeEvent.value) {
      payload.endRelativeEventId = selectedEndRelativeEvent.value._id
    } else {
      throw new Error('Please select a reference for the end date')
    }

    if (!endIsVagueRelative.value && !endOffsetAmount.value) {
      throw new Error('End offset amount is required for non-vague relative dates')
    }

    if (endIsVagueRelative.value) {
      payload.endRelativeDirection = endDirection.value
    } else {
      const signedOffset = endDirection.value === 'Before' ? -endOffsetAmount.value : endOffsetAmount.value
      payload.endRelativeOffset = signedOffset
    }
    payload.endRelativeTimeUnit = endTimeUnit.value
  } else if (eraData.value.endDateType === 'Approximation') {
    if (!endApproximateDescription.value) {
      throw new Error('End approximate description is required')
    }
    payload.endApproximateDescription = endApproximateDescription.value
  }

  return payload
}

async function saveEra() {
  try {
    const payload = buildEraPayload()

    if (isNewEra.value) {
      await erasStore.create(payload)
    } else {
      await erasStore.update(eraId.value, payload)
    }

    router.push('/eras')
  } catch (error) {
    console.error('Failed to save era:', error)
    alert(error.message || 'Failed to save era')
  }
}

// Load existing era data
function loadEraData(era) {
  eraData.value.name = era.name || ''
  eraData.value.description = era.description || ''
  eraData.value.startDateType = era.startDateType || 'Exact'
  eraData.value.endDateType = era.endDateType || 'Exact'

  // Load start date
  if (era.startDateType === 'Exact' && era.startDate) {
    startExactYear.value = era.startDate.year
    startExactMonth.value = era.startDate.month || null
    startExactDay.value = era.startDate.day || null
  } else if (era.startDateType === 'Relative') {
    if (era.startRelativeEraId) {
      startRelativeType.value = 'era'
      const refEra = erasStore.eras.find(e => e._id === era.startRelativeEraId)
      if (refEra) {
        selectedStartRelativeEra.value = refEra
        startRelativeEraSearch.value = refEra.name
      }
    } else if (era.startRelativeEventId) {
      startRelativeType.value = 'event'
      const refEvent = eventsStore.events.find(e => e._id === era.startRelativeEventId)
      if (refEvent) {
        selectedStartRelativeEvent.value = refEvent
        startRelativeEventSearch.value = refEvent.name
      }
    }

    if (era.startRelativeOffset !== null && era.startRelativeOffset !== undefined) {
      startIsVagueRelative.value = false
      startOffsetAmount.value = Math.abs(era.startRelativeOffset)
      startDirection.value = era.startRelativeOffset < 0 ? 'Before' : 'After'
    } else {
      startIsVagueRelative.value = true
      startDirection.value = era.startRelativeDirection || 'After'
    }
    startTimeUnit.value = era.startRelativeTimeUnit || 'Days'
  } else if (era.startDateType === 'Approximation') {
    startApproximateDescription.value = era.startApproximateDescription || ''
  }

  // Load end date
  if (era.endDateType === 'Exact' && era.endDate) {
    endExactYear.value = era.endDate.year
    endExactMonth.value = era.endDate.month || null
    endExactDay.value = era.endDate.day || null
  } else if (era.endDateType === 'Relative') {
    if (era.endRelativeEraId) {
      endRelativeType.value = 'era'
      const refEra = erasStore.eras.find(e => e._id === era.endRelativeEraId)
      if (refEra) {
        selectedEndRelativeEra.value = refEra
        endRelativeEraSearch.value = refEra.name
      }
    } else if (era.endRelativeEventId) {
      endRelativeType.value = 'event'
      const refEvent = eventsStore.events.find(e => e._id === era.endRelativeEventId)
      if (refEvent) {
        selectedEndRelativeEvent.value = refEvent
        endRelativeEventSearch.value = refEvent.name
      }
    }

    if (era.endRelativeOffset !== null && era.endRelativeOffset !== undefined) {
      endIsVagueRelative.value = false
      endOffsetAmount.value = Math.abs(era.endRelativeOffset)
      endDirection.value = era.endRelativeOffset < 0 ? 'Before' : 'After'
    } else {
      endIsVagueRelative.value = true
      endDirection.value = era.endRelativeDirection || 'After'
    }
    endTimeUnit.value = era.endRelativeTimeUnit || 'Days'
  } else if (era.endDateType === 'Approximation') {
    endApproximateDescription.value = era.endApproximateDescription || ''
  }
}

onMounted(async () => {
  // Load eras and events for autocomplete
  await Promise.all([
    erasStore.fetchAll(),
    eventsStore.fetchAll()
  ])

  if (!isNewEra.value) {
    await erasStore.fetchById(eraId.value)
    if (erasStore.currentEra) {
      loadEraData(erasStore.currentEra)
    }
  }
})
</script>
