import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { eventsAPI } from '../services/api'

export const useEventsStore = defineStore('events', () => {
  const events = ref([])
  const currentEvent = ref(null)
  const eventHistory = ref([])
  const loading = ref(false)
  const error = ref(null)

  const sortedEvents = computed(() => {
    return [...events.value].sort((a, b) => {
      // Use calculatedAbsoluteDate if available (in days from year 0)
      const aDate = a.calculatedAbsoluteDate ?? (a.exactDate ? a.exactDate * 365 : null)
      const bDate = b.calculatedAbsoluteDate ?? (b.exactDate ? b.exactDate * 365 : null)

      if (aDate !== null && bDate !== null) {
        // If dates are different, sort by date
        if (aDate !== bDate) {
          return aDate - bDate
        }
        // If dates are the same, sort by chapter number
        if (a.chapter !== null && b.chapter !== null && a.chapter !== b.chapter) {
          return a.chapter - b.chapter
        }
        // Finally fall back to creation time
        return a.createdAt - b.createdAt
      }
      if (aDate !== null) return -1
      if (bDate !== null) return 1

      // No dates available - sort by chapter if available
      if (a.chapter !== null && b.chapter !== null && a.chapter !== b.chapter) {
        return a.chapter - b.chapter
      }

      // Fall back to creation time if no dates or chapters available
      return a.createdAt - b.createdAt
    })
  })

  async function fetchAll() {
    loading.value = true
    error.value = null

    try {
      const response = await eventsAPI.getAll()
      events.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch events'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await eventsAPI.getById(id)
      currentEvent.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch event'
    } finally {
      loading.value = false
    }
  }

  async function fetchByCharacter(characterName) {
    loading.value = true
    error.value = null

    try {
      const response = await eventsAPI.getByCharacter(characterName)
      events.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch events'
    } finally {
      loading.value = false
    }
  }

  async function create(event) {
    loading.value = true
    error.value = null

    try {
      const response = await eventsAPI.create(event)
      events.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id, event) {
    loading.value = true
    error.value = null

    try {
      const response = await eventsAPI.update(id, event)
      const index = events.value.findIndex((e) => e._id === id)
      if (index !== -1) {
        events.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEvent(id) {
    loading.value = true
    error.value = null

    try {
      await eventsAPI.delete(id)
      events.value = events.value.filter((e) => e._id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHistory(id) {
    loading.value = true
    error.value = null

    try {
      const response = await eventsAPI.getHistory(id)
      eventHistory.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch history'
    } finally {
      loading.value = false
    }
  }

  async function revertToVersion(id, version) {
    loading.value = true
    error.value = null

    try {
      const response = await eventsAPI.revert(id, version)
      const index = events.value.findIndex((e) => e._id === id)
      if (index !== -1) {
        events.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to revert event'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    events,
    currentEvent,
    eventHistory,
    loading,
    error,
    sortedEvents,
    fetchAll,
    fetchById,
    fetchByCharacter,
    create,
    update,
    deleteEvent,
    fetchHistory,
    revertToVersion,
  }
})
