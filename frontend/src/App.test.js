import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { useAuthStore } from './stores/auth'

// Mock the router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'timeline', component: { template: '<div>Timeline</div>' } },
    { path: '/characters', name: 'characters', component: { template: '<div>Characters</div>' } },
    { path: '/locations', name: 'locations', component: { template: '<div>Locations</div>' } },
    { path: '/sagas', name: 'sagas', component: { template: '<div>Sagas</div>' } },
    { path: '/arcs', name: 'arcs', component: { template: '<div>Arcs</div>' } },
    { path: '/event/new', name: 'event-new', component: { template: '<div>New Event</div>' } },
  ],
})

describe('App.vue', () => {
  let pinia
  let wrapper

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  const mountApp = (options = {}) => {
    return mount(App, {
      global: {
        plugins: [pinia, router],
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
            props: ['to'],
          },
          RouterView: {
            template: '<div>Router View</div>',
          },
        },
      },
      ...options,
    })
  }

  describe('navigation bar', () => {
    it('renders the app title', () => {
      wrapper = mountApp()
      expect(wrapper.text()).toContain('One Piece Timeline Wiki')
    })

    it('renders navigation links', () => {
      wrapper = mountApp()
      expect(wrapper.text()).toContain('Characters')
      expect(wrapper.text()).toContain('Locations')
      expect(wrapper.text()).toContain('Sagas')
      expect(wrapper.text()).toContain('Arcs')
    })

    it('shows login button when not authenticated', () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.apiKey = ''
      authStore.user = null

      expect(wrapper.text()).toContain('Login')
    })

    it('shows user info when authenticated', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.apiKey = 'test-key'
      authStore.user = { username: 'testuser', role: 'Editor' }

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('testuser')
      expect(wrapper.text()).toContain('Editor')
    })

    it('shows logout button when authenticated', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.apiKey = 'test-key'
      authStore.user = { username: 'testuser', role: 'Editor' }

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Logout')
    })

    it('shows Add Event button for editors', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.apiKey = 'test-key'
      authStore.user = { username: 'editor', role: 'Editor' }

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Add Event')
    })

    it('shows Add Event button for admins', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.apiKey = 'test-key'
      authStore.user = { username: 'admin', role: 'Admin' }

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Add Event')
    })

    it('does not show Add Event button for viewers', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.apiKey = 'test-key'
      authStore.user = { username: 'viewer', role: 'Viewer' }

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Add Event')
    })

    it('does not show Add Event button when not authenticated', () => {
      wrapper = mountApp()
      expect(wrapper.text()).not.toContain('Add Event')
    })
  })

  describe('API key dialog', () => {
    it('does not show dialog initially', () => {
      wrapper = mountApp()
      const dialog = wrapper.find('[class*="fixed inset-0"]')
      expect(dialog.exists()).toBe(false)
    })

    it('shows dialog when login button is clicked', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.apiKey = ''
      authStore.user = null

      await wrapper.vm.$nextTick()

      const loginButton = wrapper.findAll('button').find((btn) => btn.text() === 'Login')
      await loginButton.trigger('click')

      expect(wrapper.find('[class*="fixed inset-0"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Enter API Key')
    })

    it('hides dialog when cancel button is clicked', async () => {
      wrapper = mountApp()
      wrapper.vm.showApiKeyDialog = true
      await wrapper.vm.$nextTick()

      const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
      await cancelButton.trigger('click')

      expect(wrapper.vm.showApiKeyDialog).toBe(false)
    })

    it('hides dialog when clicking outside modal', async () => {
      wrapper = mountApp()
      wrapper.vm.showApiKeyDialog = true
      await wrapper.vm.$nextTick()

      const backdrop = wrapper.find('[class*="fixed inset-0"]')
      await backdrop.trigger('click.self')

      expect(wrapper.vm.showApiKeyDialog).toBe(false)
    })

    it('calls submitApiKey when login button in dialog is clicked', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.setApiKey = vi.fn().mockResolvedValue()

      wrapper.vm.showApiKeyDialog = true
      wrapper.vm.apiKeyInput = 'test-api-key'
      await wrapper.vm.$nextTick()

      const submitButton = wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Login' && btn.classes().includes('bg-one-piece-primary'))
      await submitButton.trigger('click')

      expect(authStore.setApiKey).toHaveBeenCalledWith('test-api-key')
    })

    it('submits API key when Enter is pressed in input', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.setApiKey = vi.fn().mockResolvedValue()

      wrapper.vm.showApiKeyDialog = true
      await wrapper.vm.$nextTick()

      const input = wrapper.find('input[type="text"]')
      await input.setValue('test-key-123')
      await input.trigger('keyup.enter')

      expect(authStore.setApiKey).toHaveBeenCalledWith('test-key-123')
    })

    it('closes dialog and clears input after successful authentication', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.setApiKey = vi.fn(async (key) => {
        authStore.apiKey = key
        authStore.user = { username: 'test', role: 'Editor' }
      })

      wrapper.vm.showApiKeyDialog = true
      wrapper.vm.apiKeyInput = 'test-key'
      await wrapper.vm.$nextTick()

      await wrapper.vm.submitApiKey()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showApiKeyDialog).toBe(false)
      expect(wrapper.vm.apiKeyInput).toBe('')
    })

    it('does not close dialog if authentication fails', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.setApiKey = vi.fn().mockResolvedValue()
      authStore.isAuthenticated = false

      wrapper.vm.showApiKeyDialog = true
      wrapper.vm.apiKeyInput = 'invalid-key'
      await wrapper.vm.$nextTick()

      await wrapper.vm.submitApiKey()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showApiKeyDialog).toBe(true)
      expect(wrapper.vm.apiKeyInput).toBe('invalid-key')
    })

    it('displays error message when authentication fails', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.setApiKey = vi.fn().mockResolvedValue()
      authStore.error = 'Invalid API key'
      authStore.isAuthenticated = false

      wrapper.vm.showApiKeyDialog = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Invalid API key')
    })
  })

  describe('logout functionality', () => {
    it('calls clearApiKey when logout button is clicked', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.apiKey = 'test-key'
      authStore.user = { username: 'testuser', role: 'Editor' }
      authStore.clearApiKey = vi.fn()

      await wrapper.vm.$nextTick()

      const logoutButton = wrapper.findAll('button').find((btn) => btn.text() === 'Logout')
      await logoutButton.trigger('click')

      expect(authStore.clearApiKey).toHaveBeenCalled()
    })

    it('logout function clears auth store', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()
      authStore.apiKey = 'test-key'
      authStore.user = { username: 'testuser', role: 'Editor' }
      authStore.clearApiKey = vi.fn()

      await wrapper.vm.logout()

      expect(authStore.clearApiKey).toHaveBeenCalled()
    })
  })

  describe('component structure', () => {
    it('renders main container', () => {
      wrapper = mountApp()
      expect(wrapper.find('main').exists()).toBe(true)
    })

    it('renders navigation bar', () => {
      wrapper = mountApp()
      expect(wrapper.find('nav').exists()).toBe(true)
    })

    it('renders router view in main section', () => {
      wrapper = mountApp()
      expect(wrapper.find('main').text()).toContain('Router View')
    })
  })

  describe('reactive state', () => {
    it('apiKeyInput is initially empty', () => {
      wrapper = mountApp()
      expect(wrapper.vm.apiKeyInput).toBe('')
    })

    it('showApiKeyDialog is initially false', () => {
      wrapper = mountApp()
      expect(wrapper.vm.showApiKeyDialog).toBe(false)
    })

    it('updates apiKeyInput when typing in dialog', async () => {
      wrapper = mountApp()
      wrapper.vm.showApiKeyDialog = true
      await wrapper.vm.$nextTick()

      const input = wrapper.find('input[type="text"]')
      await input.setValue('new-key-value')

      expect(wrapper.vm.apiKeyInput).toBe('new-key-value')
    })
  })

  describe('auth store integration', () => {
    it('uses auth store for authentication state', () => {
      wrapper = mountApp()
      const authStore = useAuthStore()

      expect(wrapper.vm.authStore).toBe(authStore)
    })

    it('reactively updates UI when auth state changes', async () => {
      wrapper = mountApp()
      const authStore = useAuthStore()

      // Initially not authenticated
      authStore.apiKey = ''
      authStore.user = null
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Login')

      // Authenticate
      authStore.apiKey = 'test-key'
      authStore.user = { username: 'newuser', role: 'Admin' }
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('newuser')
      expect(wrapper.text()).toContain('Admin')
      expect(wrapper.text()).toContain('Logout')
    })
  })
})
