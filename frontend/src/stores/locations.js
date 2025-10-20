import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { locationsAPI } from '../services/api'

export const useLocationsStore = defineStore('locations', () => {
  const locations = ref([])
  const currentLocation = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const sortedLocations = computed(() => {
    return [...locations.value].sort((a, b) => {
      // Sort by type first, then by name
      const typeOrder = { Sea: 0, Island: 1, Kingdom: 2, CityTownVillage: 3 }
      const typeCompare = typeOrder[a.type] - typeOrder[b.type]
      if (typeCompare !== 0) return typeCompare
      return a.name.localeCompare(b.name)
    })
  })

  async function fetchAll() {
    loading.value = true
    error.value = null

    try {
      const response = await locationsAPI.getAll()
      locations.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch locations'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await locationsAPI.getById(id)
      currentLocation.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch location'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHierarchy(id) {
    loading.value = true
    error.value = null

    try {
      const response = await locationsAPI.getHierarchy(id)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch location hierarchy'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchChildren(id) {
    loading.value = true
    error.value = null

    try {
      const response = await locationsAPI.getChildren(id)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch child locations'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchEvents(id) {
    loading.value = true
    error.value = null

    try {
      const response = await locationsAPI.getEvents(id)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch location events'
      return []
    } finally {
      loading.value = false
    }
  }

  async function create(location) {
    loading.value = true
    error.value = null

    try {
      const response = await locationsAPI.create(location)
      locations.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create location'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id, location) {
    loading.value = true
    error.value = null

    try {
      const response = await locationsAPI.update(id, location)
      const index = locations.value.findIndex((l) => l._id === id)
      if (index !== -1) {
        locations.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update location'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteLocation(id) {
    loading.value = true
    error.value = null

    try {
      await locationsAPI.delete(id)
      locations.value = locations.value.filter((l) => l._id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete location'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    locations,
    currentLocation,
    loading,
    error,
    sortedLocations,
    fetchAll,
    fetchById,
    fetchHierarchy,
    fetchChildren,
    fetchEvents,
    create,
    update,
    deleteLocation,
  }
})
