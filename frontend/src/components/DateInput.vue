<template>
  <div class="date-input-component p-4 border border-gray-200 rounded">
    <h2 class="text-xl font-semibold mb-4">{{ label }}</h2>

    <!-- Date Type -->
    <div class="mb-4">
      <label class="block text-sm font-semibold mb-2">Date Type *</label>
      <select
        :value="dateType"
        @input="updateDateType($event.target.value)"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
      >
        <option value="Exact">Exact</option>
        <option value="Approximation">Approximation</option>
        <option value="Relative">Relative</option>
      </select>
    </div>

    <!-- Exact Date -->
    <div v-if="dateType === 'Exact'" class="mb-4">
      <!-- Toggle for relative year input -->
      <div class="mb-3">
        <label class="flex items-center gap-2">
          <input
            :checked="useRelativeYearInput"
            @input="updateUseRelativeYearInput($event.target.checked)"
            type="checkbox"
            class="rounded"
          />
          <span class="text-sm font-semibold">Enter year relative to reference</span>
        </label>
        <p class="text-xs text-gray-600 mt-1 ml-6">Use this to enter dates relative to series start ({{ SERIES_START_YEAR }}) or timeskip end ({{ TIMESKIP_END_YEAR }})</p>
      </div>

      <label class="block text-sm font-semibold mb-2">Date</label>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Year *</label>
          <div v-if="useRelativeYearInput" class="space-y-2">
            <!-- Reference year selector -->
            <select
              :value="referenceYear"
              @input="updateReferenceYear($event.target.value)"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary text-sm"
            >
              <option :value="SERIES_START_YEAR">Series Start ({{ SERIES_START_YEAR }})</option>
              <option :value="TIMESKIP_END_YEAR">Timeskip End ({{ TIMESKIP_END_YEAR }})</option>
            </select>

            <!-- Relative offset input -->
            <input
              :value="relativeYearOffset"
              @input="updateRelativeYearOffset($event.target.value)"
              type="number"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="e.g., -22 (22 years before)"
            />

            <!-- Show calculated absolute year -->
            <p v-if="calculatedAbsoluteYear != null" class="text-xs text-gray-600">
              = Year {{ calculatedAbsoluteYear }}
            </p>
          </div>
          <div v-else>
            <input
              :value="exactYear"
              @input="updateExactYear($event.target.value)"
              type="number"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1500"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">Month (1-12)</label>
          <input
            :value="exactMonth"
            @input="updateExactMonth($event.target.value)"
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
            :value="exactDay"
            @input="updateExactDay($event.target.value)"
            type="number"
            min="1"
            max="31"
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            placeholder="1"
          />
        </div>
      </div>
    </div>

    <!-- Relative Date -->
    <div v-if="dateType === 'Relative'" class="mb-4">
      <label class="block text-sm font-semibold mb-2">Reference Type *</label>
      <select
        :value="relativeType"
        @input="updateRelativeType($event.target.value)"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary mb-4"
      >
        <option value="era">Relative to Era</option>
        <option value="event">Relative to Event</option>
      </select>

      <!-- Search for Era -->
      <div v-if="relativeType === 'era'" class="relative mb-4">
        <label class="block text-sm font-semibold mb-2">Select Era *</label>
        <input
          v-model="relativeEraSearch"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Start typing era name..."
          @input="filterEras"
          @focus="showEraSuggestions = true"
          @blur="() => setTimeout(() => showEraSuggestions = false, 200)"
        />

        <div
          v-if="showEraSuggestions && filteredEraSuggestions.length > 0"
          class="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1"
        >
          <button
            v-for="era in filteredEraSuggestions"
            :key="era._id"
            type="button"
            @mousedown.prevent="selectRelativeEra(era)"
            class="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
          >
            <div class="font-semibold">{{ era.name }}</div>
            <div class="text-xs text-gray-500">{{ era.startDisplayYear ? `Starts: Year ${era.startDisplayYear}` : 'Unknown date' }}</div>
          </button>
        </div>
      </div>

      <!-- Search for Event -->
      <div v-if="relativeType === 'event'" class="relative mb-4">
        <label class="block text-sm font-semibold mb-2">Select Event *</label>
        <input
          v-model="relativeEventSearch"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Start typing event name..."
          @input="filterEvents"
          @focus="showEventSuggestions = true"
          @blur="() => setTimeout(() => showEventSuggestions = false, 200)"
        />

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

      <!-- Selected Reference Display -->
      <div v-if="selectedRelativeEra || selectedRelativeEvent" class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-semibold">{{ selectedRelativeEra?.name || selectedRelativeEvent?.name }}</div>
            <div class="text-sm text-gray-600">
              <span v-if="selectedRelativeEra">Era - Starts: Year {{ selectedRelativeEra.startDisplayYear || 'Unknown' }}</span>
              <span v-if="selectedRelativeEvent">{{ selectedRelativeEvent.type }} - Year {{ selectedRelativeEvent.displayYear || 'Unknown' }}</span>
            </div>
          </div>
          <button
            type="button"
            @click="clearRelative"
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
            :checked="isVagueRelative"
            @input="updateVagueRelative($event.target.checked)"
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
            Offset Amount {{ isVagueRelative ? '(optional)' : '*' }}
          </label>
          <input
            :value="offsetAmount"
            @input="updateOffsetAmount($event.target.value)"
            type="number"
            :required="!isVagueRelative"
            :disabled="isVagueRelative"
            min="0"
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary disabled:bg-gray-100"
            :placeholder="isVagueRelative ? 'N/A' : 'e.g., 2'"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-2">Direction *</label>
          <select
            :value="direction"
            @input="updateDirection($event.target.value)"
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
            :value="timeUnit"
            @input="updateTimeUnit($event.target.value)"
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

    <!-- Approximation Date -->
    <div v-if="dateType === 'Approximation'" class="mb-4">
      <label class="block text-sm font-semibold mb-2">Description *</label>
      <input
        :value="approximateDescription"
        @input="updateApproximateDescription($event.target.value)"
        type="text"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
        placeholder="e.g., 'Long ago', 'Ancient times', 'Recent years'"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SERIES_START_YEAR, TIMESKIP_END_YEAR, relativeToAbsolute } from '../utils/yearDisplay.js'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  dateType: {
    type: String,
    required: true
  },
  exactYear: Number,
  exactMonth: Number,
  exactDay: Number,
  useRelativeYearInput: {
    type: Boolean,
    default: false
  },
  relativeYearOffset: Number,
  referenceYear: Number,
  relativeType: {
    type: String,
    default: 'era'
  },
  selectedRelativeEra: Object,
  selectedRelativeEvent: Object,
  offsetAmount: Number,
  direction: {
    type: String,
    default: 'After'
  },
  timeUnit: {
    type: String,
    default: 'Days'
  },
  isVagueRelative: {
    type: Boolean,
    default: false
  },
  approximateDescription: String,
  eras: {
    type: Array,
    default: () => []
  },
  events: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:dateType',
  'update:exactYear',
  'update:exactMonth',
  'update:exactDay',
  'update:useRelativeYearInput',
  'update:relativeYearOffset',
  'update:referenceYear',
  'update:relativeType',
  'update:selectedRelativeEra',
  'update:selectedRelativeEvent',
  'update:offsetAmount',
  'update:direction',
  'update:timeUnit',
  'update:isVagueRelative',
  'update:approximateDescription'
])

// Local state for autocomplete
const relativeEraSearch = ref('')
const relativeEventSearch = ref('')
const showEraSuggestions = ref(false)
const showEventSuggestions = ref(false)

const filteredEraSuggestions = computed(() => {
  if (!relativeEraSearch.value) return props.eras
  const search = relativeEraSearch.value.toLowerCase()
  return props.eras.filter(era => era.name.toLowerCase().includes(search))
})

const filteredEventSuggestions = computed(() => {
  if (!relativeEventSearch.value) return props.events
  const search = relativeEventSearch.value.toLowerCase()
  return props.events.filter(event => event.name.toLowerCase().includes(search))
})

const calculatedAbsoluteYear = computed(() => {
  return relativeToAbsolute(props.relativeYearOffset, props.referenceYear)
})

// Update methods
function updateDateType(value) {
  emit('update:dateType', value)
}

function updateExactYear(value) {
  emit('update:exactYear', value ? Number(value) : null)
}

function updateExactMonth(value) {
  emit('update:exactMonth', value ? Number(value) : null)
}

function updateExactDay(value) {
  emit('update:exactDay', value ? Number(value) : null)
}

function updateRelativeType(value) {
  emit('update:relativeType', value)
  emit('update:selectedRelativeEra', null)
  emit('update:selectedRelativeEvent', null)
  relativeEraSearch.value = ''
  relativeEventSearch.value = ''
}

function selectRelativeEra(era) {
  emit('update:selectedRelativeEra', era)
  emit('update:selectedRelativeEvent', null)
  relativeEraSearch.value = era.name
  showEraSuggestions.value = false
}

function selectRelativeEvent(event) {
  emit('update:selectedRelativeEvent', event)
  emit('update:selectedRelativeEra', null)
  relativeEventSearch.value = event.name
  showEventSuggestions.value = false
}

function clearRelative() {
  emit('update:selectedRelativeEra', null)
  emit('update:selectedRelativeEvent', null)
  relativeEraSearch.value = ''
  relativeEventSearch.value = ''
}

function updateOffsetAmount(value) {
  emit('update:offsetAmount', value ? Number(value) : null)
}

function updateDirection(value) {
  emit('update:direction', value)
}

function updateTimeUnit(value) {
  emit('update:timeUnit', value)
}

function updateVagueRelative(value) {
  emit('update:isVagueRelative', value)
}

function updateApproximateDescription(value) {
  emit('update:approximateDescription', value)
}

function updateUseRelativeYearInput(value) {
  emit('update:useRelativeYearInput', value)
}

function updateRelativeYearOffset(value) {
  emit('update:relativeYearOffset', value ? Number(value) : null)
}

function updateReferenceYear(value) {
  emit('update:referenceYear', value ? Number(value) : null)
}

function filterEras() {
  showEraSuggestions.value = true
}

function filterEvents() {
  showEventSuggestions.value = true
}
</script>
