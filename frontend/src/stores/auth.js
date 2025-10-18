import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usersAPI } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const apiKey = ref(localStorage.getItem('apiKey') || '')
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!apiKey.value)
  const isEditor = computed(() => user.value?.role === 'Editor' || user.value?.role === 'Admin')
  const isAdmin = computed(() => user.value?.role === 'Admin')

  async function setApiKey(key) {
    apiKey.value = key
    localStorage.setItem('apiKey', key)
    await fetchUser()
  }

  function clearApiKey() {
    apiKey.value = ''
    user.value = null
    localStorage.removeItem('apiKey')
  }

  async function fetchUser() {
    if (!apiKey.value) return

    loading.value = true
    error.value = null

    try {
      const response = await usersAPI.getMe()
      user.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch user'
      clearApiKey()
    } finally {
      loading.value = false
    }
  }

  // Initialize user on store creation
  if (apiKey.value) {
    fetchUser()
  }

  return {
    apiKey,
    user,
    loading,
    error,
    isAuthenticated,
    isEditor,
    isAdmin,
    setApiKey,
    clearApiKey,
    fetchUser,
  }
})
