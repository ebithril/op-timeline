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
        <div class="flex justify-between items-start">
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
import { onMounted } from 'vue'
import { useArcsStore } from '../stores/arcs'
import { useSagasStore } from '../stores/sagas'

const arcsStore = useArcsStore()
const sagasStore = useSagasStore()

function getSagaName(sagaId) {
  const saga = sagasStore.sagas.find(s => s._id === sagaId)
  return saga ? saga.name : 'Unknown Saga'
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
