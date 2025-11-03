<template>
  <div class="era-edit-view max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-one-piece-dark">
      {{ isNewEra ? 'Create New Era' : 'Edit Era' }}
    </h1>

    <!-- Loading State -->
    <div v-if="erasStore.loading" class="text-center py-8">
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

      <!-- Start Date -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Start Date *</label>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Year *</label>
            <input
              v-model.number="eraData.startDate.year"
              type="number"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Month (1-12)</label>
            <input
              v-model.number="eraData.startDate.month"
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
              v-model.number="eraData.startDate.day"
              type="number"
              min="1"
              max="31"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1"
            />
          </div>
        </div>
      </div>

      <!-- End Date -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">End Date *</label>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Year *</label>
            <input
              v-model.number="eraData.endDate.year"
              type="number"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1550"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Month (1-12)</label>
            <input
              v-model.number="eraData.endDate.month"
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
              v-model.number="eraData.endDate.day"
              type="number"
              min="1"
              max="31"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="31"
            />
          </div>
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useErasStore } from '../stores/eras'

const route = useRoute()
const router = useRouter()
const erasStore = useErasStore()

const eraId = computed(() => route.params.id)
const isNewEra = computed(() => !eraId.value || eraId.value === 'new')

const eraData = ref({
  name: '',
  description: '',
  startDate: {
    year: null,
    month: null,
    day: null,
  },
  endDate: {
    year: null,
    month: null,
    day: null,
  },
})

async function saveEra() {
  try {
    // Validate that at least year is provided for both dates
    if (!eraData.value.startDate.year || !eraData.value.endDate.year) {
      alert('Start and end year are required')
      return
    }

    // Clean up data - build proper ExactDate objects
    const dataToSave = {
      name: eraData.value.name,
      startDate: {
        year: eraData.value.startDate.year,
      },
      endDate: {
        year: eraData.value.endDate.year,
      },
    }

    // Add optional date fields
    if (eraData.value.startDate.month) {
      dataToSave.startDate.month = eraData.value.startDate.month
    }
    if (eraData.value.startDate.day) {
      dataToSave.startDate.day = eraData.value.startDate.day
    }
    if (eraData.value.endDate.month) {
      dataToSave.endDate.month = eraData.value.endDate.month
    }
    if (eraData.value.endDate.day) {
      dataToSave.endDate.day = eraData.value.endDate.day
    }

    // Add description if provided
    if (eraData.value.description) {
      dataToSave.description = eraData.value.description
    }

    if (isNewEra.value) {
      await erasStore.create(dataToSave)
    } else {
      await erasStore.update(eraId.value, dataToSave)
    }

    router.push('/eras')
  } catch (error) {
    console.error('Failed to save era:', error)
    alert('Failed to save era')
  }
}

onMounted(async () => {
  if (!isNewEra.value) {
    await erasStore.fetchById(eraId.value)
    if (erasStore.currentEra) {
      eraData.value = {
        name: erasStore.currentEra.name || '',
        description: erasStore.currentEra.description || '',
        startDate: {
          year: erasStore.currentEra.startDate?.year || null,
          month: erasStore.currentEra.startDate?.month || null,
          day: erasStore.currentEra.startDate?.day || null,
        },
        endDate: {
          year: erasStore.currentEra.endDate?.year || null,
          month: erasStore.currentEra.endDate?.month || null,
          day: erasStore.currentEra.endDate?.day || null,
        },
      }
    }
  }
})
</script>
