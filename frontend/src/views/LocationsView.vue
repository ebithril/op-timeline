<template>
  <div class="locations-view">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-one-piece-dark">Locations</h1>
      <router-link
        v-if="authStore.isEditor"
        to="/locations/new"
        class="px-4 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
      >
        Add New Location
      </router-link>
    </div>

    <!-- Search Bar -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <input
        v-model="searchQuery"
        type="text"
        class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
        placeholder="Search locations..."
      />
    </div>

    <!-- Loading State -->
    <div v-if="locationsStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="locationsStore.error" class="bg-red-100 p-4 rounded text-red-700">
      {{ locationsStore.error }}
    </div>

    <!-- Locations List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="location in filteredLocations"
        :key="location._id"
        class="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-gray-200"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xl font-bold text-one-piece-dark">
            <router-link
              :to="`/locations/${location._id}`"
              class="hover:text-one-piece-primary"
            >
              {{ location.name }}
            </router-link>
          </h3>
          <span :class="getTypeClass(location.type)" class="px-2 py-1 text-xs rounded">
            {{ formatLocationType(location.type) }}
          </span>
        </div>

        <div v-if="location.description" class="text-sm text-gray-600 mb-2 line-clamp-2">
          {{ location.description }}
        </div>

        <div class="flex flex-wrap gap-2 mt-3">
          <button
            @click="toggleHierarchy(location._id)"
            class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            {{ showingHierarchy[location._id] ? 'Hide' : 'View' }} Hierarchy
          </button>
          <button
            @click="toggleChildren(location._id)"
            class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            {{ showingChildren[location._id] ? 'Hide' : 'View' }} Children
          </button>
          <router-link
            v-if="authStore.isEditor"
            :to="`/locations/${location._id}/edit`"
            class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Edit
          </router-link>
          <button
            v-if="authStore.isAdmin"
            @click="deleteLocation(location._id)"
            class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Delete
          </button>
        </div>

        <!-- Hierarchy -->
        <div v-if="showingHierarchy[location._id]" class="mt-4 pt-4 border-t border-gray-200">
          <h4 class="text-sm font-semibold mb-2">Location Hierarchy</h4>
          <div v-if="loadingHierarchies[location._id]" class="text-center py-2 text-gray-600 text-sm">
            Loading...
          </div>
          <div v-else-if="locationHierarchies[location._id]?.length > 0" class="space-y-1">
            <div class="text-sm">
              <span v-for="(loc, index) in locationHierarchies[location._id]" :key="loc._id">
                <router-link
                  :to="`/locations/${loc._id}`"
                  class="text-one-piece-primary hover:underline"
                >
                  {{ loc.name }}
                </router-link>
                <span v-if="index < locationHierarchies[location._id].length - 1"> → </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Children -->
        <div v-if="showingChildren[location._id]" class="mt-4 pt-4 border-t border-gray-200">
          <h4 class="text-sm font-semibold mb-2">Child Locations ({{ locationChildren[location._id]?.length || 0 }})</h4>
          <div v-if="loadingChildren[location._id]" class="text-center py-2 text-gray-600 text-sm">
            Loading...
          </div>
          <div v-else-if="locationChildren[location._id]?.length > 0" class="space-y-1">
            <router-link
              v-for="child in locationChildren[location._id]"
              :key="child._id"
              :to="`/locations/${child._id}`"
              class="block p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm transition"
            >
              <span class="font-semibold">{{ child.name }}</span>
              <span class="text-xs text-gray-600 ml-2">{{ formatLocationType(child.type) }}</span>
            </router-link>
          </div>
          <div v-else class="text-center py-2 text-gray-600 text-sm">
            No child locations
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!locationsStore.loading && filteredLocations.length === 0" class="text-center py-8 text-gray-600">
      No locations found. Add some locations to get started!
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useLocationsStore } from '../stores/locations'
import { useAuthStore } from '../stores/auth'

const locationsStore = useLocationsStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const showingHierarchy = reactive({})
const showingChildren = reactive({})
const loadingHierarchies = reactive({})
const loadingChildren = reactive({})
const locationHierarchies = reactive({})
const locationChildren = reactive({})

const filteredLocations = computed(() => {
  if (!searchQuery.value.trim()) {
    return locationsStore.sortedLocations
  }

  const search = searchQuery.value.toLowerCase()
  return locationsStore.sortedLocations.filter(loc =>
    loc.name.toLowerCase().includes(search) ||
    (loc.description && loc.description.toLowerCase().includes(search))
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

function getTypeClass(type) {
  const classMap = {
    'Sea': 'bg-blue-100 text-blue-800',
    'Island': 'bg-green-100 text-green-800',
    'Kingdom': 'bg-purple-100 text-purple-800',
    'CityTownVillage': 'bg-yellow-100 text-yellow-800'
  }
  return classMap[type] || 'bg-gray-100 text-gray-800'
}

async function toggleHierarchy(locationId) {
  showingHierarchy[locationId] = !showingHierarchy[locationId]

  if (showingHierarchy[locationId] && !locationHierarchies[locationId]) {
    loadingHierarchies[locationId] = true
    try {
      const hierarchy = await locationsStore.fetchHierarchy(locationId)
      locationHierarchies[locationId] = hierarchy
    } catch (error) {
      console.error('Failed to load location hierarchy:', error)
      locationHierarchies[locationId] = []
    } finally {
      loadingHierarchies[locationId] = false
    }
  }
}

async function toggleChildren(locationId) {
  showingChildren[locationId] = !showingChildren[locationId]

  if (showingChildren[locationId] && !locationChildren[locationId]) {
    loadingChildren[locationId] = true
    try {
      const children = await locationsStore.fetchChildren(locationId)
      locationChildren[locationId] = children
    } catch (error) {
      console.error('Failed to load child locations:', error)
      locationChildren[locationId] = []
    } finally {
      loadingChildren[locationId] = false
    }
  }
}

async function deleteLocation(id) {
  if (confirm('Are you sure you want to delete this location?')) {
    try {
      await locationsStore.deleteLocation(id)
    } catch (error) {
      alert('Failed to delete location: ' + (error.response?.data?.error || error.message))
    }
  }
}

onMounted(async () => {
  await locationsStore.fetchAll()
})
</script>
