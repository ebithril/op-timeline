<template>
  <div class="sagas-view max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-one-piece-dark">Sagas</h1>
      <router-link
        to="/sagas/new"
        class="px-4 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
      >
        Create New Saga
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="sagasStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading sagas...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="sagasStore.error" class="bg-red-100 p-4 rounded text-red-700 mb-4">
      {{ sagasStore.error }}
    </div>

    <!-- Sagas List -->
    <div v-else-if="sagasStore.sortedSagas.length > 0" class="space-y-4">
      <div
        v-for="saga in sagasStore.sortedSagas"
        :key="saga._id"
        class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-one-piece-dark mb-2">
              {{ saga.order }}. {{ saga.name }}
            </h2>
            <p v-if="saga.description" class="text-gray-700 mb-3">
              {{ saga.description }}
            </p>
            <div class="text-sm text-gray-600">
              <p v-if="saga.startChapter">
                Chapters: {{ saga.startChapter }}
                <span v-if="saga.endChapter">- {{ saga.endChapter }}</span>
                <span v-else>- Ongoing</span>
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="toggleTimeline(saga._id)"
              class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              {{ showingTimeline[saga._id] ? 'Hide' : 'View' }} Timeline
            </button>
            <router-link
              :to="`/sagas/${saga._id}`"
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Edit
            </router-link>
            <button
              @click="confirmDelete(saga)"
              class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Timeline -->
        <div v-if="showingTimeline[saga._id]" class="mt-4 pt-4 border-t border-gray-200">
          <h3 class="text-lg font-semibold mb-3">Saga Timeline ({{ sagaTimelines[saga._id]?.length || 0 }} events)</h3>
          <div v-if="loadingTimelines[saga._id]" class="text-center py-4 text-gray-600">
            Loading timeline...
          </div>
          <div v-else-if="sagaTimelines[saga._id]?.length > 0" class="space-y-2">
            <router-link
              v-for="event in sagaTimelines[saga._id]"
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
            No events in this saga yet
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-50 rounded-lg">
      <p class="text-gray-600 mb-4">No sagas found</p>
      <router-link
        to="/sagas/new"
        class="px-4 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark inline-block"
      >
        Create Your First Saga
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { useSagasStore } from '../stores/sagas'
import { sagasAPI } from '../services/api'

const sagasStore = useSagasStore()

const showingTimeline = reactive({})
const loadingTimelines = reactive({})
const sagaTimelines = reactive({})

function formatEventDate(event) {
  if (event.displayYear) {
    return `Year ${event.displayYear}`
  }
  if (event.exactDate) {
    return `Year ${event.exactDate.year || event.exactDate}`
  }
  return 'Unknown date'
}

async function toggleTimeline(sagaId) {
  showingTimeline[sagaId] = !showingTimeline[sagaId]

  if (showingTimeline[sagaId] && !sagaTimelines[sagaId]) {
    loadingTimelines[sagaId] = true
    try {
      const response = await sagasAPI.getTimeline(sagaId)
      sagaTimelines[sagaId] = response.data
    } catch (error) {
      console.error('Failed to load saga timeline:', error)
      sagaTimelines[sagaId] = []
    } finally {
      loadingTimelines[sagaId] = false
    }
  }
}

async function confirmDelete(saga) {
  if (confirm(`Are you sure you want to delete the saga "${saga.name}"?`)) {
    try {
      await sagasStore.deleteSaga(saga._id)
    } catch (error) {
      console.error('Failed to delete saga:', error)
      alert('Failed to delete saga')
    }
  }
}

onMounted(async () => {
  await sagasStore.fetchAll()
})
</script>
