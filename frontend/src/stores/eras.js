import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { erasAPI } from '../services/api'

export const useErasStore = defineStore('eras', () => {
  const eras = ref([])
  const currentEra = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const sortedEras = computed(() => {
    return [...eras.value].sort((a, b) => {
      // Sort by start date (year, then month, then day)
      if (a.startDate.year !== b.startDate.year) {
        return a.startDate.year - b.startDate.year
      }
      const aMonth = a.startDate.month || 0
      const bMonth = b.startDate.month || 0
      if (aMonth !== bMonth) {
        return aMonth - bMonth
      }
      const aDay = a.startDate.day || 0
      const bDay = b.startDate.day || 0
      return aDay - bDay
    })
  })

  async function fetchAll() {
    loading.value = true
    error.value = null

    try {
      const response = await erasAPI.getAll()
      eras.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch eras'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await erasAPI.getById(id)
      currentEra.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch era'
    } finally {
      loading.value = false
    }
  }

  async function create(era) {
    loading.value = true
    error.value = null

    try {
      const response = await erasAPI.create(era)
      eras.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create era'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id, era) {
    loading.value = true
    error.value = null

    try {
      const response = await erasAPI.update(id, era)
      const index = eras.value.findIndex((e) => e._id === id)
      if (index !== -1) {
        eras.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update era'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEra(id) {
    loading.value = true
    error.value = null

    try {
      await erasAPI.delete(id)
      eras.value = eras.value.filter((e) => e._id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete era'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    eras,
    currentEra,
    loading,
    error,
    sortedEras,
    fetchAll,
    fetchById,
    create,
    update,
    deleteEra,
  }
})
