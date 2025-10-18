import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { charactersAPI } from '../services/api'

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref([])
  const currentCharacter = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const sortedCharacters = computed(() => {
    return [...characters.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  async function fetchAll() {
    loading.value = true
    error.value = null

    try {
      const response = await charactersAPI.getAll()
      characters.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch characters'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await charactersAPI.getById(id)
      currentCharacter.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch character'
    } finally {
      loading.value = false
    }
  }

  async function search(query) {
    loading.value = true
    error.value = null

    try {
      const response = await charactersAPI.search(query)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to search characters'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAliveAtDate(date) {
    loading.value = true
    error.value = null

    try {
      const response = await charactersAPI.getAliveAtDate(date)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch characters'
      return []
    } finally {
      loading.value = false
    }
  }

  async function create(character) {
    loading.value = true
    error.value = null

    try {
      const response = await charactersAPI.create(character)
      characters.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create character'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id, character) {
    loading.value = true
    error.value = null

    try {
      const response = await charactersAPI.update(id, character)
      const index = characters.value.findIndex((c) => c._id === id)
      if (index !== -1) {
        characters.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update character'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCharacter(id) {
    loading.value = true
    error.value = null

    try {
      await charactersAPI.delete(id)
      characters.value = characters.value.filter((c) => c._id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete character'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    characters,
    currentCharacter,
    loading,
    error,
    sortedCharacters,
    fetchAll,
    fetchById,
    search,
    fetchAliveAtDate,
    create,
    update,
    deleteCharacter,
  }
})
