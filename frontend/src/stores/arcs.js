import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { arcsAPI } from '../services/api'

export const useArcsStore = defineStore('arcs', () => {
  const arcs = ref([])
  const currentArc = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const sortedArcs = computed(() => {
    return [...arcs.value].sort((a, b) => {
      // Sort by start chapter
      if (a.startChapter !== null && b.startChapter !== null) {
        return a.startChapter - b.startChapter
      }
      if (a.startChapter !== null) return -1
      if (b.startChapter !== null) return 1
      return a.name.localeCompare(b.name)
    })
  })

  async function fetchAll() {
    loading.value = true
    error.value = null

    try {
      const response = await arcsAPI.getAll()
      arcs.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch arcs'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await arcsAPI.getById(id)
      currentArc.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch arc'
    } finally {
      loading.value = false
    }
  }

  async function fetchBySagaId(sagaId) {
    loading.value = true
    error.value = null

    try {
      const response = await arcsAPI.getBySagaId(sagaId)
      arcs.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch arcs'
    } finally {
      loading.value = false
    }
  }

  async function create(arc) {
    loading.value = true
    error.value = null

    try {
      const response = await arcsAPI.create(arc)
      arcs.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create arc'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id, arc) {
    loading.value = true
    error.value = null

    try {
      const response = await arcsAPI.update(id, arc)
      const index = arcs.value.findIndex((a) => a._id === id)
      if (index !== -1) {
        arcs.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update arc'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteArc(id) {
    loading.value = true
    error.value = null

    try {
      await arcsAPI.delete(id)
      arcs.value = arcs.value.filter((a) => a._id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete arc'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    arcs,
    currentArc,
    loading,
    error,
    sortedArcs,
    fetchAll,
    fetchById,
    fetchBySagaId,
    create,
    update,
    deleteArc,
  }
})
