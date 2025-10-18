<template>
  <div class="saga-edit-view max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-one-piece-dark">
      {{ isNewSaga ? 'Create New Saga' : 'Edit Saga' }}
    </h1>

    <!-- Loading State -->
    <div v-if="sagasStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="sagasStore.error" class="bg-red-100 p-4 rounded text-red-700 mb-4">
      {{ sagasStore.error }}
    </div>

    <!-- Saga Form -->
    <form v-else @submit.prevent="saveSaga" class="bg-white p-6 rounded-lg shadow">
      <!-- Name -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Name *</label>
        <input
          v-model="sagaData.name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter saga name"
        />
      </div>

      <!-- Order -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Order *</label>
        <input
          v-model.number="sagaData.order"
          type="number"
          required
          min="1"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="e.g., 1"
        />
        <p class="text-xs text-gray-600 mt-1">The chronological order of this saga</p>
      </div>

      <!-- Start Chapter -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Start Chapter</label>
        <input
          v-model.number="sagaData.startChapter"
          type="number"
          min="1"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="e.g., 1"
        />
      </div>

      <!-- End Chapter -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">End Chapter</label>
        <input
          v-model.number="sagaData.endChapter"
          type="number"
          min="1"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="e.g., 100 (leave empty if ongoing)"
        />
      </div>

      <!-- Description -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Description</label>
        <textarea
          v-model="sagaData.description"
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter saga description"
        ></textarea>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-4">
        <button
          type="submit"
          class="px-6 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
        >
          {{ isNewSaga ? 'Create Saga' : 'Save Changes' }}
        </button>
        <router-link
          to="/sagas"
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
import { useSagasStore } from '../stores/sagas'

const route = useRoute()
const router = useRouter()
const sagasStore = useSagasStore()

const sagaId = computed(() => route.params.id)
const isNewSaga = computed(() => !sagaId.value || sagaId.value === 'new')

const sagaData = ref({
  name: '',
  order: null,
  startChapter: null,
  endChapter: null,
  description: '',
})

async function saveSaga() {
  try {
    // Clean up data - remove null values for optional fields
    const dataToSave = {
      name: sagaData.value.name,
      order: sagaData.value.order,
    }

    if (sagaData.value.startChapter) {
      dataToSave.startChapter = sagaData.value.startChapter
    }
    if (sagaData.value.endChapter) {
      dataToSave.endChapter = sagaData.value.endChapter
    }
    if (sagaData.value.description) {
      dataToSave.description = sagaData.value.description
    }

    if (isNewSaga.value) {
      await sagasStore.create(dataToSave)
    } else {
      await sagasStore.update(sagaId.value, dataToSave)
    }

    router.push('/sagas')
  } catch (error) {
    console.error('Failed to save saga:', error)
    alert('Failed to save saga')
  }
}

onMounted(async () => {
  if (!isNewSaga.value) {
    await sagasStore.fetchById(sagaId.value)
    if (sagasStore.currentSaga) {
      sagaData.value = {
        name: sagasStore.currentSaga.name || '',
        order: sagasStore.currentSaga.order || null,
        startChapter: sagasStore.currentSaga.startChapter || null,
        endChapter: sagasStore.currentSaga.endChapter || null,
        description: sagasStore.currentSaga.description || '',
      }
    }
  }
})
</script>
