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
        <div class="flex justify-between items-start">
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
import { onMounted } from 'vue'
import { useSagasStore } from '../stores/sagas'

const sagasStore = useSagasStore()

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
