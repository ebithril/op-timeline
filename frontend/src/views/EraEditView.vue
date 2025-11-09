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

      <!-- START DATE using DateInput Component -->
      <div class="mb-8">
        <DateInput
          label="Start Date"
          :date-type="eraData.startDateType"
          @update:date-type="eraData.startDateType = $event"
          :exact-year="startExactYear"
          @update:exact-year="startExactYear = $event"
          :exact-month="startExactMonth"
          @update:exact-month="startExactMonth = $event"
          :exact-day="startExactDay"
          @update:exact-day="startExactDay = $event"
          :relative-type="startRelativeType"
          @update:relative-type="startRelativeType = $event"
          :selected-relative-era="selectedStartRelativeEra"
          @update:selected-relative-era="selectedStartRelativeEra = $event"
          :selected-relative-event="selectedStartRelativeEvent"
          @update:selected-relative-event="selectedStartRelativeEvent = $event"
          :offset-amount="startOffsetAmount"
          @update:offset-amount="startOffsetAmount = $event"
          :direction="startDirection"
          @update:direction="startDirection = $event"
          :time-unit="startTimeUnit"
          @update:time-unit="startTimeUnit = $event"
          :is-vague-relative="startIsVagueRelative"
          @update:is-vague-relative="startIsVagueRelative = $event"
          :approximate-description="startApproximateDescription"
          @update:approximate-description="startApproximateDescription = $event"
          :eras="erasStore.eras.filter(e => e._id !== eraId)"
          :events="eventsStore.events"
        />
      </div>

      <!-- END DATE using DateInput Component -->
      <div class="mb-8">
        <DateInput
          label="End Date"
          :date-type="eraData.endDateType"
          @update:date-type="eraData.endDateType = $event"
          :exact-year="endExactYear"
          @update:exact-year="endExactYear = $event"
          :exact-month="endExactMonth"
          @update:exact-month="endExactMonth = $event"
          :exact-day="endExactDay"
          @update:exact-day="endExactDay = $event"
          :relative-type="endRelativeType"
          @update:relative-type="endRelativeType = $event"
          :selected-relative-era="selectedEndRelativeEra"
          @update:selected-relative-era="selectedEndRelativeEra = $event"
          :selected-relative-event="selectedEndRelativeEvent"
          @update:selected-relative-event="selectedEndRelativeEvent = $event"
          :offset-amount="endOffsetAmount"
          @update:offset-amount="endOffsetAmount = $event"
          :direction="endDirection"
          @update:direction="endDirection = $event"
          :time-unit="endTimeUnit"
          @update:time-unit="endTimeUnit = $event"
          :is-vague-relative="endIsVagueRelative"
          @update:is-vague-relative="endIsVagueRelative = $event"
          :approximate-description="endApproximateDescription"
          @update:approximate-description="endApproximateDescription = $event"
          :eras="erasStore.eras.filter(e => e._id !== eraId)"
          :events="eventsStore.events"
        />
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useErasStore } from '../stores/eras'
import { useEventsStore } from '../stores/events'
import DateInput from '../components/DateInput.vue'

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
const startRelativeType = ref('era')
const selectedStartRelativeEra = ref(null)
const selectedStartRelativeEvent = ref(null)
const startIsVagueRelative = ref(false)
const startOffsetAmount = ref(null)
const startDirection = ref('After')
const startTimeUnit = ref('Days')
const startApproximateDescription = ref('')

// End date UI state
const endExactYear = ref(null)
const endExactMonth = ref(null)
const endExactDay = ref(null)
const endRelativeType = ref('era')
const selectedEndRelativeEra = ref(null)
const selectedEndRelativeEvent = ref(null)
const endIsVagueRelative = ref(false)
const endOffsetAmount = ref(null)
const endDirection = ref('After')
const endTimeUnit = ref('Days')
const endApproximateDescription = ref('')

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
      }
    } else if (era.startRelativeEventId) {
      startRelativeType.value = 'event'
      const refEvent = eventsStore.events.find(e => e._id === era.startRelativeEventId)
      if (refEvent) {
        selectedStartRelativeEvent.value = refEvent
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
      }
    } else if (era.endRelativeEventId) {
      endRelativeType.value = 'event'
      const refEvent = eventsStore.events.find(e => e._id === era.endRelativeEventId)
      if (refEvent) {
        selectedEndRelativeEvent.value = refEvent
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
