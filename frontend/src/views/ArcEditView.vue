<template>
  <div class="arc-edit-view max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-one-piece-dark">
      {{ isNewArc ? 'Create New Arc' : 'Edit Arc' }}
    </h1>

    <!-- Loading State -->
    <div v-if="arcsStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="arcsStore.error" class="bg-red-100 p-4 rounded text-red-700 mb-4">
      {{ arcsStore.error }}
    </div>

    <!-- Arc Form -->
    <form v-else @submit.prevent="saveArc" class="bg-white p-6 rounded-lg shadow">
      <!-- Name -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Name *</label>
        <input
          v-model="arcData.name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter arc name"
        />
      </div>

      <!-- Saga -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Saga</label>
        <select
          v-model="arcData.sagaId"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
        >
          <option :value="null">No saga</option>
          <option v-for="saga in sagasStore.sortedSagas" :key="saga._id" :value="saga._id">
            {{ saga.name }}
          </option>
        </select>
      </div>

      <!-- Start Chapter -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Start Chapter</label>
        <input
          v-model.number="arcData.startChapter"
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
          v-model.number="arcData.endChapter"
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
          v-model="arcData.description"
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter arc description"
        ></textarea>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-4">
        <button
          type="submit"
          class="px-6 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
        >
          {{ isNewArc ? 'Create Arc' : 'Save Changes' }}
        </button>
        <router-link
          to="/arcs"
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
import { useArcsStore } from '../stores/arcs'
import { useSagasStore } from '../stores/sagas'

const route = useRoute()
const router = useRouter()
const arcsStore = useArcsStore()
const sagasStore = useSagasStore()

const arcId = computed(() => route.params.id)
const isNewArc = computed(() => !arcId.value || arcId.value === 'new')

const arcData = ref({
  name: '',
  sagaId: null,
  startChapter: null,
  endChapter: null,
  description: '',
})

async function saveArc() {
  try {
    // Clean up data - remove null values for optional fields
    const dataToSave = {
      name: arcData.value.name,
    }

    if (arcData.value.sagaId) {
      dataToSave.sagaId = arcData.value.sagaId
    }
    if (arcData.value.startChapter) {
      dataToSave.startChapter = arcData.value.startChapter
    }
    if (arcData.value.endChapter) {
      dataToSave.endChapter = arcData.value.endChapter
    }
    if (arcData.value.description) {
      dataToSave.description = arcData.value.description
    }

    if (isNewArc.value) {
      await arcsStore.create(dataToSave)
    } else {
      await arcsStore.update(arcId.value, dataToSave)
    }

    router.push('/arcs')
  } catch (error) {
    console.error('Failed to save arc:', error)
    alert('Failed to save arc')
  }
}

onMounted(async () => {
  await sagasStore.fetchAll()

  if (!isNewArc.value) {
    await arcsStore.fetchById(arcId.value)
    if (arcsStore.currentArc) {
      arcData.value = {
        name: arcsStore.currentArc.name || '',
        sagaId: arcsStore.currentArc.sagaId || null,
        startChapter: arcsStore.currentArc.startChapter || null,
        endChapter: arcsStore.currentArc.endChapter || null,
        description: arcsStore.currentArc.description || '',
      }
    }
  }
})
</script>
