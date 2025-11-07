<template>
  <div class="eras-view max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-one-piece-dark">Eras</h1>
      <router-link
        to="/eras/new"
        class="px-4 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
      >
        Create New Era
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="erasStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading eras...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="erasStore.error" class="bg-red-100 p-4 rounded text-red-700 mb-4">
      {{ erasStore.error }}
    </div>

    <!-- Eras List -->
    <div v-else-if="erasStore.sortedEras.length > 0" class="space-y-4">
      <div
        v-for="era in erasStore.sortedEras"
        :key="era._id"
        class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-one-piece-dark mb-2">
              {{ era.name }}
            </h2>
            <p v-if="era.description" class="text-gray-700 mb-3">
              {{ era.description }}
            </p>
            <div class="text-sm text-gray-600 space-y-1">
              <p>
                <span class="font-semibold">Time Period:</span>
                {{ formatEraDate(era, 'start') }} - {{ formatEraDate(era, 'end') }}
              </p>
              <p v-if="era.startDateType === 'Relative' || era.endDateType === 'Relative'" class="text-xs italic text-gray-500">
                (Contains relative dates)
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="toggleTimeline(era._id)"
              class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              {{ showingTimeline[era._id] ? 'Hide' : 'View' }} Timeline
            </button>
            <router-link
              :to="`/eras/${era._id}`"
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Edit
            </router-link>
            <button
              @click="confirmDelete(era)"
              class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Timeline -->
        <div v-if="showingTimeline[era._id]" class="mt-4 pt-4 border-t border-gray-200">
          <h3 class="text-lg font-semibold mb-3">Era Timeline ({{ eraTimelines[era._id]?.length || 0 }} events)</h3>
          <div v-if="loadingTimelines[era._id]" class="text-center py-4 text-gray-600">
            Loading timeline...
          </div>
          <div v-else-if="eraTimelines[era._id]?.length > 0" class="space-y-2">
            <router-link
              v-for="event in eraTimelines[era._id]"
              :key="event._id"
              :to="`/event/${event._id}`"
              class="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-semibold">{{ event.name }}</h4>
                  <p class="text-xs text-gray-600 mt-1">{{ event.type }} - {{ formatEventDate(event) }}</p>
                </div>
                <span class="text-blue-500 text-sm">→</span>
              </div>
            </router-link>
          </div>
          <div v-else class="text-center py-4 text-gray-600">
            No events in this era yet
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-50 rounded-lg">
      <p class="text-gray-600 mb-4">No eras found</p>
      <router-link
        to="/eras/new"
        class="px-4 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark inline-block"
      >
        Create Your First Era
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue'
import { useErasStore } from '../stores/eras'
import { erasAPI } from '../services/api'

const erasStore = useErasStore()

const showingTimeline = reactive({})
const loadingTimelines = reactive({})
const eraTimelines = reactive({})

function formatEraDate(era, type) {
  // type is 'start' or 'end'
  const dateType = type === 'start' ? era.startDateType : era.endDateType

  if (dateType === 'Approximation') {
    const desc = type === 'start' ? era.startApproximateDescription : era.endApproximateDescription
    return desc || 'Unknown'
  }

  // For exact or relative dates, use the calculated or direct date
  const calculatedDate = type === 'start' ? era.startCalculatedExactDate : era.endCalculatedExactDate
  const directDate = type === 'start' ? era.startDate : era.endDate
  const displayYear = type === 'start' ? era.startDisplayYear : era.endDisplayYear

  const date = calculatedDate || directDate

  if (!date && displayYear) {
    return `Year ${displayYear}`
  }

  if (!date) return 'Unknown'

  let result = `Year ${date.year}`
  if (date.month) {
    result += `, Month ${date.month}`
  }
  if (date.day) {
    result += `, Day ${date.day}`
  }
  return result
}

function formatEventDate(event) {
  if (event.displayYear) {
    return `Year ${event.displayYear}`
  }
  if (event.exactDate) {
    return `Year ${event.exactDate.year || event.exactDate}`
  }
  return 'Unknown date'
}

async function toggleTimeline(eraId) {
  showingTimeline[eraId] = !showingTimeline[eraId]

  // Load timeline if showing and not already loaded
  if (showingTimeline[eraId] && !eraTimelines[eraId]) {
    loadingTimelines[eraId] = true
    try {
      const response = await erasAPI.getTimeline(eraId)
      eraTimelines[eraId] = response.data
    } catch (error) {
      console.error('Failed to load era timeline:', error)
      eraTimelines[eraId] = []
    } finally {
      loadingTimelines[eraId] = false
    }
  }
}

async function confirmDelete(era) {
  if (confirm(`Are you sure you want to delete the era "${era.name}"?`)) {
    try {
      await erasStore.deleteEra(era._id)
    } catch (error) {
      console.error('Failed to delete era:', error)
      alert('Failed to delete era')
    }
  }
}

onMounted(async () => {
  await erasStore.fetchAll()
})
</script>
