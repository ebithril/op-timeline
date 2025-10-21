import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'
import { usersAPI } from '../services/api'

vi.mock('../services/api')

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('initializes with empty apiKey when not in localStorage', () => {
      const store = useAuthStore()
      expect(store.apiKey).toBe('')
    })

    it('initializes with apiKey from localStorage', () => {
      localStorage.setItem('apiKey', 'test-key-123')
      const store = useAuthStore()
      expect(store.apiKey).toBe('test-key-123')
    })

    it('initializes with null user', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('initializes with loading false', () => {
      const store = useAuthStore()
      expect(store.loading).toBe(false)
    })

    it('initializes with null error', () => {
      const store = useAuthStore()
      expect(store.error).toBeNull()
    })
  })

  describe('computed properties', () => {
    describe('isAuthenticated', () => {
      it('returns false when no apiKey', () => {
        const store = useAuthStore()
        expect(store.isAuthenticated).toBe(false)
      })

      it('returns true when apiKey is set', () => {
        const store = useAuthStore()
        store.apiKey = 'test-key'
        expect(store.isAuthenticated).toBe(true)
      })
    })

    describe('isEditor', () => {
      it('returns false when user is null', () => {
        const store = useAuthStore()
        expect(store.isEditor).toBe(false)
      })

      it('returns false when user is Viewer', () => {
        const store = useAuthStore()
        store.user = { username: 'test', role: 'Viewer' }
        expect(store.isEditor).toBe(false)
      })

      it('returns true when user is Editor', () => {
        const store = useAuthStore()
        store.user = { username: 'test', role: 'Editor' }
        expect(store.isEditor).toBe(true)
      })

      it('returns true when user is Admin', () => {
        const store = useAuthStore()
        store.user = { username: 'test', role: 'Admin' }
        expect(store.isEditor).toBe(true)
      })
    })

    describe('isAdmin', () => {
      it('returns false when user is null', () => {
        const store = useAuthStore()
        expect(store.isAdmin).toBe(false)
      })

      it('returns false when user is Viewer', () => {
        const store = useAuthStore()
        store.user = { username: 'test', role: 'Viewer' }
        expect(store.isAdmin).toBe(false)
      })

      it('returns false when user is Editor', () => {
        const store = useAuthStore()
        store.user = { username: 'test', role: 'Editor' }
        expect(store.isAdmin).toBe(false)
      })

      it('returns true when user is Admin', () => {
        const store = useAuthStore()
        store.user = { username: 'test', role: 'Admin' }
        expect(store.isAdmin).toBe(true)
      })
    })
  })

  describe('setApiKey', () => {
    it('sets apiKey in state', async () => {
      const store = useAuthStore()
      usersAPI.getMe = vi.fn().mockResolvedValue({ data: { username: 'test' } })

      await store.setApiKey('new-key')

      expect(store.apiKey).toBe('new-key')
    })

    it('saves apiKey to localStorage', async () => {
      const store = useAuthStore()
      usersAPI.getMe = vi.fn().mockResolvedValue({ data: { username: 'test' } })

      await store.setApiKey('new-key')

      expect(localStorage.getItem('apiKey')).toBe('new-key')
    })

    it('fetches user after setting apiKey', async () => {
      const store = useAuthStore()
      const mockUser = { username: 'testuser', role: 'Editor' }
      usersAPI.getMe = vi.fn().mockResolvedValue({ data: mockUser })

      await store.setApiKey('new-key')

      expect(usersAPI.getMe).toHaveBeenCalled()
      expect(store.user).toEqual(mockUser)
    })
  })

  describe('clearApiKey', () => {
    it('clears apiKey from state', () => {
      const store = useAuthStore()
      store.apiKey = 'test-key'
      store.user = { username: 'test' }

      store.clearApiKey()

      expect(store.apiKey).toBe('')
    })

    it('clears user from state', () => {
      const store = useAuthStore()
      store.apiKey = 'test-key'
      store.user = { username: 'test' }

      store.clearApiKey()

      expect(store.user).toBeNull()
    })

    it('removes apiKey from localStorage', () => {
      localStorage.setItem('apiKey', 'test-key')
      const store = useAuthStore()

      store.clearApiKey()

      expect(localStorage.getItem('apiKey')).toBeNull()
    })
  })

  describe('fetchUser', () => {
    it('does nothing when no apiKey', async () => {
      const store = useAuthStore()
      usersAPI.getMe = vi.fn()

      await store.fetchUser()

      expect(usersAPI.getMe).not.toHaveBeenCalled()
    })

    it('fetches user successfully', async () => {
      const store = useAuthStore()
      store.apiKey = 'test-key'
      const mockUser = { username: 'testuser', role: 'Admin' }
      usersAPI.getMe = vi.fn().mockResolvedValue({ data: mockUser })

      await store.fetchUser()

      expect(store.user).toEqual(mockUser)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets loading to true during fetch', async () => {
      const store = useAuthStore()
      store.apiKey = 'test-key'
      usersAPI.getMe = vi.fn().mockResolvedValue({ data: {} })

      const promise = store.fetchUser()
      expect(store.loading).toBe(true)
      await promise
    })

    it('clears apiKey on fetch failure', async () => {
      const store = useAuthStore()
      store.apiKey = 'invalid-key'
      usersAPI.getMe = vi.fn().mockRejectedValue({
        response: { data: { error: 'Invalid API key' } },
      })

      await store.fetchUser()

      expect(store.apiKey).toBe('')
      expect(store.user).toBeNull()
      expect(store.error).toBe('Invalid API key')
    })

    it('uses default error message when response has no error', async () => {
      const store = useAuthStore()
      store.apiKey = 'test-key'
      usersAPI.getMe = vi.fn().mockRejectedValue({})

      await store.fetchUser()

      expect(store.error).toBe('Failed to fetch user')
    })

    it('removes apiKey from localStorage on failure', async () => {
      localStorage.setItem('apiKey', 'invalid-key')
      const store = useAuthStore()
      store.apiKey = 'invalid-key'
      usersAPI.getMe = vi.fn().mockRejectedValue({
        response: { data: { error: 'Invalid API key' } },
      })

      await store.fetchUser()

      expect(localStorage.getItem('apiKey')).toBeNull()
    })
  })

  describe('auto-initialization', () => {
    it('fetches user on store creation when apiKey in localStorage', async () => {
      localStorage.setItem('apiKey', 'existing-key')
      const mockUser = { username: 'existinguser', role: 'Editor' }
      usersAPI.getMe = vi.fn().mockResolvedValue({ data: mockUser })

      const store = useAuthStore()

      // Wait for the auto-fetch to complete
      await vi.waitFor(() => expect(usersAPI.getMe).toHaveBeenCalled())
    })

    it('does not fetch user when no apiKey in localStorage', () => {
      usersAPI.getMe = vi.fn()

      const store = useAuthStore()

      expect(usersAPI.getMe).not.toHaveBeenCalled()
    })
  })
})
