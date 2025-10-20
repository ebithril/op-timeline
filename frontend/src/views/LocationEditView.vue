<template>
  <div class="location-edit-view max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-one-piece-dark">
      {{ isNewLocation ? 'Create New Location' : 'Edit Location' }}
    </h1>

    <!-- Loading State -->
    <div v-if="locationsStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="locationsStore.error" class="bg-red-100 p-4 rounded text-red-700 mb-4">
      {{ locationsStore.error }}
    </div>

    <!-- Location Form -->
    <form v-else @submit.prevent="saveLocation" class="bg-white p-6 rounded-lg shadow">
      <!-- Name -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Name *</label>
        <input
          v-model="locationData.name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter location name"
        />
      </div>

      <!-- Type -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Type *</label>
        <select
          v-model="locationData.type"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
        >
          <option value="">Select a type</option>
          <option value="Sea">Sea</option>
          <option value="Island">Island</option>
          <option value="Kingdom">Kingdom</option>
          <option value="CityTownVillage">City/Town/Village</option>
        </select>
      </div>

      <!-- Parent Location -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Parent Location</label>
        <div class="relative">
          <input
            v-model="parentLocationSearch"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            placeholder="Search for parent location..."
            @input="searchParentLocations"
            @focus="showParentSuggestions = true"
          />

          <!-- Clear parent location button -->
          <button
            v-if="locationData.parentLocationId"
            type="button"
            @click="clearParentLocation"
            class="absolute right-2 top-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Clear
          </button>

          <!-- Current parent location -->
          <div v-if="selectedParentLocation && !showParentSuggestions" class="mt-2 p-2 bg-blue-50 rounded text-sm">
            <span class="font-semibold">Selected:</span> {{ selectedParentLocation.name }}
            <span class="text-xs text-gray-600 ml-2">({{ formatLocationType(selectedParentLocation.type) }})</span>
          </div>

          <!-- Parent location suggestions -->
          <div
            v-if="showParentSuggestions && filteredParentLocations.length > 0"
            class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto"
          >
            <div
              v-for="loc in filteredParentLocations"
              :key="loc._id"
              @click="selectParentLocation(loc)"
              class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <div class="font-semibold">{{ loc.name }}</div>
              <div class="text-xs text-gray-600">{{ formatLocationType(loc.type) }}</div>
            </div>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Optional: Select a parent location (e.g., an island for a city, a sea for an island)
        </p>
      </div>

      <!-- Description -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Description</label>
        <textarea
          v-model="locationData.description"
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter location description"
        ></textarea>
      </div>

      <!-- Hierarchy Preview (for existing locations with parents) -->
      <div v-if="!isNewLocation && locationHierarchy.length > 0" class="mb-4 p-4 bg-gray-50 rounded">
        <label class="block text-sm font-semibold mb-2">Current Hierarchy</label>
        <div class="text-sm">
          <span v-for="(loc, index) in locationHierarchy" :key="loc._id">
            {{ loc.name }}
            <span v-if="index < locationHierarchy.length - 1"> → </span>
          </span>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-4">
        <button
          type="submit"
          class="px-6 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
        >
          {{ isNewLocation ? 'Create Location' : 'Save Changes' }}
        </button>
        <router-link
          to="/locations"
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
import { useLocationsStore } from '../stores/locations'

const route = useRoute()
const router = useRouter()
const locationsStore = useLocationsStore()

const locationId = computed(() => route.params.id)
const isNewLocation = computed(() => !locationId.value || locationId.value === 'new')

const locationData = ref({
  name: '',
  type: '',
  parentLocationId: null,
  description: '',
})

const parentLocationSearch = ref('')
const showParentSuggestions = ref(false)
const allLocations = ref([])
const selectedParentLocation = ref(null)
const locationHierarchy = ref([])

const filteredParentLocations = computed(() => {
  if (!parentLocationSearch.value.trim()) {
    // Exclude the current location from parent options
    return allLocations.value.filter(loc => loc._id !== locationId.value)
  }

  const search = parentLocationSearch.value.toLowerCase()
  return allLocations.value
    .filter(loc =>
      loc._id !== locationId.value && // Can't be parent of itself
      (loc.name.toLowerCase().includes(search) ||
       (loc.description && loc.description.toLowerCase().includes(search)))
    )
})

function formatLocationType(type) {
  const typeMap = {
    'Sea': 'Sea',
    'Island': 'Island',
    'Kingdom': 'Kingdom',
    'CityTownVillage': 'City/Town/Village'
  }
  return typeMap[type] || type
}

function selectParentLocation(location) {
  locationData.value.parentLocationId = location._id
  selectedParentLocation.value = location
  parentLocationSearch.value = location.name
  showParentSuggestions.value = false
}

function clearParentLocation() {
  locationData.value.parentLocationId = null
  selectedParentLocation.value = null
  parentLocationSearch.value = ''
}

function searchParentLocations() {
  showParentSuggestions.value = true
}

async function saveLocation() {
  try {
    const dataToSave = {
      ...locationData.value,
    }

    if (isNewLocation.value) {
      await locationsStore.create(dataToSave)
    } else {
      await locationsStore.update(locationId.value, dataToSave)
    }

    router.push('/locations')
  } catch (error) {
    console.error('Failed to save location:', error)
    alert('Failed to save location: ' + (error.response?.data?.error || error.message))
  }
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.relative')) {
    showParentSuggestions.value = false
  }
})

onMounted(async () => {
  // Load all locations for parent selection
  await locationsStore.fetchAll()
  allLocations.value = locationsStore.locations

  if (!isNewLocation.value) {
    const location = await locationsStore.fetchById(locationId.value)
    if (location) {
      locationData.value = {
        name: location.name || '',
        type: location.type || '',
        parentLocationId: location.parentLocationId || null,
        description: location.description || '',
      }

      // Load parent location info if exists
      if (location.parentLocationId) {
        const parent = allLocations.value.find(l => l._id === location.parentLocationId)
        if (parent) {
          selectedParentLocation.value = parent
          parentLocationSearch.value = parent.name
        }
      }

      // Load hierarchy
      try {
        locationHierarchy.value = await locationsStore.fetchHierarchy(locationId.value)
      } catch (error) {
        console.error('Failed to load hierarchy:', error)
      }
    }
  }
})
</script>
