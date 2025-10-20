<template>
  <div class="arcs-view max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-one-piece-dark">Story Arcs</h1>
      <router-link
        to="/arcs/new"
        class="px-4 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
      >
        Create New Arc
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="arcsStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading arcs...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="arcsStore.error" class="bg-red-100 p-4 rounded text-red-700 mb-4">
      {{ arcsStore.error }}
    </div>

    <!-- Arcs List -->
    <div v-else-if="arcsStore.sortedArcs.length > 0" class="space-y-4">
      <div
        v-for="arc in arcsStore.sortedArcs"
        :key="arc._id"
        class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-one-piece-dark mb-2">
              {{ arc.name }}
            </h2>
            <p v-if="arc.description" class="text-gray-700 mb-3">
              {{ arc.description }}
            </p>
            <div class="text-sm text-gray-600 space-y-1">
              <p v-if="arc.startChapter || arc.endChapter">
                <span class="font-semibold">Chapters:</span>
                <span v-if="arc.startChapter">{{ arc.startChapter }}</span>
                <span v-if="arc.endChapter"> - {{ arc.endChapter }}</span>
                <span v-else-if="arc.startChapter"> - Ongoing</span>
              </p>
              <p v-if="arc.sagaId">
                <span class="font-semibold">Saga:</span>
                {{ getSagaName(arc.sagaId) }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="toggleTimeline(arc._id)"
              class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              {{ showingTimeline[arc._id] ? 'Hide' : 'View' }} Timeline
            </button>
            <router-link
              :to="`/arcs/${arc._id}`"
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Edit
            </router-link>
            <button
              @click="confirmDelete(arc)"
              class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Timeline -->
        <div v-if="showingTimeline[arc._id]" class="mt-4 pt-4 border-t border-gray-200">
          <h3 class="text-lg font-semibold mb-3">Arc Timeline ({{ arcTimelines[arc._id]?.length || 0 }} events)</h3>
          <div v-if="loadingTimelines[arc._id]" class="text-center py-4 text-gray-600">
            Loading timeline...
          </div>
          <div v-else-if="arcTimelines[arc._id]?.length > 0" class="space-y-2">
            <router-link
              v-for="event in arcTimelines[arc._id]"
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
            No events in this arc yet
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-50 rounded-lg">
      <p class="text-gray-600 mb-4">No arcs found</p>
      <router-link
        to="/arcs/new"
        class="px-4 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark inline-block"
      >
        Create Your First Arc
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue'
import { useArcsStore } from '../stores/arcs'
import { useSagasStore } from '../stores/sagas'
import { arcsAPI } from '../services/api'

const arcsStore = useArcsStore()
const sagasStore = useSagasStore()

const showingTimeline = reactive({})
const loadingTimelines = reactive({})
const arcTimelines = reactive({})

function getSagaName(sagaId) {
  const saga = sagasStore.sagas.find(s => s._id === sagaId)
  return saga ? saga.name : 'Unknown Saga'
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

async function toggleTimeline(arcId) {
  showingTimeline[arcId] = !showingTimeline[arcId]

  // Load timeline if showing and not already loaded
  if (showingTimeline[arcId] && !arcTimelines[arcId]) {
    loadingTimelines[arcId] = true
    try {
      const response = await arcsAPI.getTimeline(arcId)
      arcTimelines[arcId] = response.data
    } catch (error) {
      console.error('Failed to load arc timeline:', error)
      arcTimelines[arcId] = []
    } finally {
      loadingTimelines[arcId] = false
    }
  }
}

async function confirmDelete(arc) {
  if (confirm(`Are you sure you want to delete the arc "${arc.name}"?`)) {
    try {
      await arcsStore.deleteArc(arc._id)
    } catch (error) {
      console.error('Failed to delete arc:', error)
      alert('Failed to delete arc')
    }
  }
}

onMounted(async () => {
  await Promise.all([
    arcsStore.fetchAll(),
    sagasStore.fetchAll()
  ])
})
</script>
