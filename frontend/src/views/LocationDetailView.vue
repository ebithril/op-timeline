<template>
  <div class="location-detail-view max-w-6xl mx-auto">
    <!-- Loading State -->
    <div v-if="locationsStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="locationsStore.error" class="bg-red-100 p-4 rounded text-red-700">
      {{ locationsStore.error }}
    </div>

    <!-- Location Details -->
    <div v-else-if="location" class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-one-piece-dark mb-2">{{ location.name }}</h1>
          <span :class="getTypeClass(location.type)" class="px-3 py-1 text-sm rounded">
            {{ formatLocationType(location.type) }}
          </span>
        </div>
        <div class="flex gap-2">
          <router-link
            v-if="authStore.isEditor"
            :to="`/locations/${location._id}/edit`"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </router-link>
          <button
            v-if="authStore.isAdmin"
            @click="deleteLocation"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Description -->
      <div v-if="location.description" class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-3">Description</h2>
        <p class="text-gray-700">{{ location.description }}</p>
      </div>

      <!-- Location Hierarchy -->
      <div v-if="hierarchy.length > 0" class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-3">Location Hierarchy</h2>
        <div class="text-lg">
          <span v-for="(loc, index) in hierarchy" :key="loc._id">
            <router-link
              :to="`/locations/${loc._id}`"
              class="text-one-piece-primary hover:underline"
              :class="{ 'font-bold': loc._id === location._id }"
            >
              {{ loc.name }}
            </router-link>
            <span v-if="index < hierarchy.length - 1" class="mx-2 text-gray-400">→</span>
          </span>
        </div>
      </div>

      <!-- Child Locations -->
      <div v-if="children.length > 0" class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-3">Child Locations ({{ children.length }})</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <router-link
            v-for="child in children"
            :key="child._id"
            :to="`/locations/${child._id}`"
            class="p-3 bg-gray-50 hover:bg-gray-100 rounded transition border border-gray-200"
          >
            <div class="font-semibold">{{ child.name }}</div>
            <div class="text-xs text-gray-600">{{ formatLocationType(child.type) }}</div>
          </router-link>
        </div>
      </div>

      <!-- Events at this Location -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-3">Events at this Location ({{ events.length }})</h2>

        <div v-if="loadingEvents" class="text-center py-4 text-gray-600">
          Loading events...
        </div>

        <div v-else-if="events.length > 0" class="space-y-3">
          <router-link
            v-for="event in events"
            :key="event._id"
            :to="`/event/${event._id}`"
            class="block p-4 bg-gray-50 hover:bg-gray-100 rounded transition border border-gray-200"
          >
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-bold text-lg">{{ event.name }}</h3>
              <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {{ event.type }}
              </span>
            </div>
            <div class="text-sm text-gray-600">{{ formatEventDate(event) }}</div>
            <div v-if="event.description" class="text-sm text-gray-700 mt-2 line-clamp-2">
              {{ event.description }}
            </div>
          </router-link>
        </div>

        <div v-else class="text-center py-8 text-gray-600">
          No events recorded at this location yet.
        </div>
      </div>

      <!-- Metadata -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-3">Metadata</h2>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-semibold">Created:</span>
            {{ formatDate(location.createdAt) }}
            <span v-if="location.createdBy" class="text-gray-600">by {{ location.createdBy }}</span>
          </div>
          <div>
            <span class="font-semibold">Updated:</span>
            {{ formatDate(location.updatedAt) }}
            <span v-if="location.updatedBy" class="text-gray-600">by {{ location.updatedBy }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocationsStore } from '../stores/locations'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const locationsStore = useLocationsStore()
const authStore = useAuthStore()

const locationId = computed(() => route.params.id)
const location = ref(null)
const hierarchy = ref([])
const children = ref([])
const events = ref([])
const loadingEvents = ref(false)

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

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatEventDate(event) {
  if (event.displayYear) {
    return `Year ${event.displayYear}`
  }
  if (event.exactDate) {
    return `Year ${event.exactDate.year || event.exactDate}`
  }
  if (event.approximateDescription) {
    return event.approximateDescription
  }
  return 'Unknown date'
}

async function deleteLocation() {
  if (confirm('Are you sure you want to delete this location? This cannot be undone.')) {
    try {
      await locationsStore.deleteLocation(locationId.value)
      router.push('/locations')
    } catch (error) {
      alert('Failed to delete location: ' + (error.response?.data?.error || error.message))
    }
  }
}

onMounted(async () => {
  try {
    // Fetch location details
    location.value = await locationsStore.fetchById(locationId.value)

    // Fetch hierarchy
    hierarchy.value = await locationsStore.fetchHierarchy(locationId.value)

    // Fetch children
    children.value = await locationsStore.fetchChildren(locationId.value)

    // Fetch events
    loadingEvents.value = true
    try {
      events.value = await locationsStore.fetchEvents(locationId.value)
    } catch (error) {
      console.error('Failed to load events:', error)
      events.value = []
    } finally {
      loadingEvents.value = false
    }
  } catch (error) {
    console.error('Failed to load location:', error)
  }
})
</script>
