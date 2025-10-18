import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sagasAPI } from '../services/api'

export const useSagasStore = defineStore('sagas', () => {
  const sagas = ref([])
  const currentSaga = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const sortedSagas = computed(() => {
    return [...sagas.value].sort((a, b) => a.order - b.order)
  })

  async function fetchAll() {
    loading.value = true
    error.value = null

    try {
      const response = await sagasAPI.getAll()
      sagas.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch sagas'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await sagasAPI.getById(id)
      currentSaga.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch saga'
    } finally {
      loading.value = false
    }
  }

  async function create(saga) {
    loading.value = true
    error.value = null

    try {
      const response = await sagasAPI.create(saga)
      sagas.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create saga'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id, saga) {
    loading.value = true
    error.value = null

    try {
      const response = await sagasAPI.update(id, saga)
      const index = sagas.value.findIndex((s) => s._id === id)
      if (index !== -1) {
        sagas.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update saga'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSaga(id) {
    loading.value = true
    error.value = null

    try {
      await sagasAPI.delete(id)
      sagas.value = sagas.value.filter((s) => s._id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete saga'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    sagas,
    currentSaga,
    loading,
    error,
    sortedSagas,
    fetchAll,
    fetchById,
    create,
    update,
    deleteSaga,
  }
})
