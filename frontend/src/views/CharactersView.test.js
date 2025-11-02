import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CharactersView from './CharactersView.vue'
import { useCharactersStore } from '../stores/characters'
import { useAuthStore } from '../stores/auth'
import { charactersAPI } from '../services/api'

vi.mock('../services/api')

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/characters', component: { template: '<div>Characters</div>' } },
    { path: '/characters/new', component: { template: '<div>New Character</div>' } },
    { path: '/characters/:id', component: { template: '<div>Character Detail</div>' } },
    { path: '/characters/:id/edit', component: { template: '<div>Character Edit</div>' } },
  ],
})

describe('CharactersView', () => {
  let pinia
  let charactersStore
  let authStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    charactersStore = useCharactersStore()
    authStore = useAuthStore()

    // Mock store methods
    charactersStore.fetchAll = vi.fn()
    charactersStore.deleteCharacter = vi.fn()

    // Set up default store state
    charactersStore.loading = false
    charactersStore.error = null
    charactersStore.characters = []
    authStore.user = null

    // Mock API
    charactersAPI.getTimeline = vi.fn()
  })

  const mountComponent = (options = {}) => {
    return mount(CharactersView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
            props: ['to'],
          },
        },
      },
      ...options,
    })
  }

  describe('component mounting and initialization', () => {
    it('renders the characters title', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Characters')
    })

    it('fetches characters on mount', async () => {
      mountComponent()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(charactersStore.fetchAll).toHaveBeenCalled()
    })

    it('shows Add New Character button for editors', async () => {
      authStore.user = { username: 'editor', role: 'Editor' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Add New Character')
    })

    it('does not show Add New Character button for viewers', async () => {
      authStore.user = { username: 'viewer', role: 'Viewer' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Add New Character')
    })
  })

  describe('loading and error states', () => {
    it('displays loading state', async () => {
      charactersStore.loading = true
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Loading...')
    })

    it('displays error message', async () => {
      charactersStore.error = 'Failed to load characters'
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Failed to load characters')
    })
  })

  describe('search functionality', () => {
    beforeEach(() => {
      charactersStore.characters = [
        { _id: '1', name: 'Monkey D. Luffy', aliases: ['Straw Hat'] },
        { _id: '2', name: 'Roronoa Zoro', aliases: ['Pirate Hunter'] },
        { _id: '3', name: 'Nami', aliases: ['Cat Burglar'] },
        { _id: '4', name: 'Tony Tony Chopper', aliases: ['Cotton Candy Lover'] },
      ]
    })

    it('shows all characters when search is empty', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.filteredCharacters).toHaveLength(4)
    })

    it('filters characters by name', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('Luffy')

      expect(wrapper.vm.filteredCharacters).toHaveLength(1)
      expect(wrapper.vm.filteredCharacters[0].name).toBe('Monkey D. Luffy')
    })

    it('filters characters by alias', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('Straw Hat')

      expect(wrapper.vm.filteredCharacters).toHaveLength(1)
      expect(wrapper.vm.filteredCharacters[0].name).toBe('Monkey D. Luffy')
    })

    it('search is case-insensitive', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('luffy')

      expect(wrapper.vm.filteredCharacters).toHaveLength(1)
    })

    it('shows multiple matching results', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('o')

      expect(wrapper.vm.filteredCharacters.length).toBeGreaterThan(1)
    })

    it('shows no results when search does not match', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('Shanks')

      expect(wrapper.vm.filteredCharacters).toHaveLength(0)
    })
  })

  describe('timeline toggle functionality', () => {
    beforeEach(() => {
      charactersStore.characters = [
        { _id: 'char1', name: 'Luffy' },
      ]
    })

    it('timeline is hidden by default', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showingTimeline['char1']).toBeFalsy()
    })

    it('toggles timeline visibility', async () => {
      charactersAPI.getTimeline.mockResolvedValue({ data: [] })
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      await wrapper.vm.toggleTimeline('char1')

      expect(wrapper.vm.showingTimeline['char1']).toBe(true)

      await wrapper.vm.toggleTimeline('char1')

      expect(wrapper.vm.showingTimeline['char1']).toBe(false)
    })

    it('fetches timeline data when shown for first time', async () => {
      const mockEvents = [
        { _id: 'e1', name: 'Event 1', type: 'Birth', displayYear: 1500 },
      ]
      charactersAPI.getTimeline.mockResolvedValue({ data: mockEvents })

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      await wrapper.vm.toggleTimeline('char1')

      expect(charactersAPI.getTimeline).toHaveBeenCalledWith('char1')
      expect(wrapper.vm.characterTimelines['char1']).toEqual(mockEvents)
    })

    it('does not re-fetch timeline when toggled again', async () => {
      charactersAPI.getTimeline.mockResolvedValue({ data: [] })

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      await wrapper.vm.toggleTimeline('char1')
      expect(charactersAPI.getTimeline).toHaveBeenCalledTimes(1)

      await wrapper.vm.toggleTimeline('char1')
      await wrapper.vm.toggleTimeline('char1')

      expect(charactersAPI.getTimeline).toHaveBeenCalledTimes(1)
    })

    it('shows loading state while fetching timeline', async () => {
      charactersAPI.getTimeline.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
      )

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const togglePromise = wrapper.vm.toggleTimeline('char1')

      expect(wrapper.vm.loadingTimelines['char1']).toBe(true)

      await togglePromise

      expect(wrapper.vm.loadingTimelines['char1']).toBe(false)
    })

    it('handles timeline fetch error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      charactersAPI.getTimeline.mockRejectedValue(new Error('Fetch failed'))

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      await wrapper.vm.toggleTimeline('char1')

      expect(wrapper.vm.characterTimelines['char1']).toEqual([])
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('event date formatting', () => {
    it('formats event with displayYear', () => {
      const wrapper = mountComponent()
      const event = { displayYear: 1520 }

      const formatted = wrapper.vm.formatEventDate(event)
      expect(formatted).toBe('Year 1520')
    })

    it('formats event with exactDate object', () => {
      const wrapper = mountComponent()
      const event = { exactDate: { year: 1539, month: 5, day: 10 } }

      const formatted = wrapper.vm.formatEventDate(event)
      expect(formatted).toBe('Year 1539')
    })

    it('formats event with exactDate as number', () => {
      const wrapper = mountComponent()
      const event = { exactDate: 1525 }

      const formatted = wrapper.vm.formatEventDate(event)
      expect(formatted).toBe('Year 1525')
    })

    it('returns Unknown date for event without date info', () => {
      const wrapper = mountComponent()
      const event = {}

      const formatted = wrapper.vm.formatEventDate(event)
      expect(formatted).toBe('Unknown date')
    })
  })

  describe('delete character', () => {
    beforeEach(() => {
      global.confirm = vi.fn()
      global.alert = vi.fn()
      charactersStore.characters = [
        { _id: 'char1', name: 'Luffy' },
      ]
    })

    it('prompts for confirmation before deleting', async () => {
      global.confirm.mockReturnValue(false)
      const wrapper = mountComponent()

      await wrapper.vm.deleteCharacter('char1')

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this character?')
      expect(charactersStore.deleteCharacter).not.toHaveBeenCalled()
    })

    it('deletes character when confirmed', async () => {
      global.confirm.mockReturnValue(true)
      charactersStore.deleteCharacter.mockResolvedValue()
      const wrapper = mountComponent()

      await wrapper.vm.deleteCharacter('char1')

      expect(charactersStore.deleteCharacter).toHaveBeenCalledWith('char1')
    })

    it('shows alert on delete error', async () => {
      global.confirm.mockReturnValue(true)
      charactersStore.deleteCharacter.mockRejectedValue(new Error('Delete failed'))
      const wrapper = mountComponent()

      await wrapper.vm.deleteCharacter('char1')

      expect(global.alert).toHaveBeenCalledWith('Failed to delete character')
    })
  })

  describe('permission-based UI elements', () => {
    beforeEach(() => {
      charactersStore.characters = [
        { _id: 'char1', name: 'Luffy' },
      ]
    })

    it('shows edit button for editors', async () => {
      authStore.user = { username: 'editor', role: 'Editor' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const editButtons = wrapper.findAll('a').filter(a => a.text() === 'Edit')
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('shows delete button for admins', async () => {
      authStore.user = { username: 'admin', role: 'Admin' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const deleteButtons = wrapper.findAll('button').filter(b => b.text() === 'Delete')
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('does not show edit button for viewers', async () => {
      authStore.user = { username: 'viewer', role: 'Viewer' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const editButtons = wrapper.findAll('a').filter(a => a.text() === 'Edit')
      expect(editButtons.length).toBe(0)
    })

    it('does not show delete button for editors', async () => {
      authStore.user = { username: 'editor', role: 'Editor' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const deleteButtons = wrapper.findAll('button').filter(b => b.text() === 'Delete')
      expect(deleteButtons.length).toBe(0)
    })
  })

  describe('empty state', () => {
    it('shows empty state message when no characters', async () => {
      charactersStore.characters = []
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No characters found')
    })

    it('shows empty state when search returns no results', async () => {
      charactersStore.characters = [
        { _id: '1', name: 'Luffy', aliases: [] },
      ]
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('NonExistent')

      expect(wrapper.text()).toContain('No characters found')
    })
  })

  describe('character display', () => {
    it('displays character birth date when available', async () => {
      charactersStore.characters = [
        { _id: '1', name: 'Luffy', birthDate: 1500 },
      ]
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Born:')
      expect(wrapper.text()).toContain('1500')
    })

    it('displays character death date when available', async () => {
      charactersStore.characters = [
        { _id: '1', name: 'Ace', birthDate: 1480, deathDate: 1539 },
      ]
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Died:')
      expect(wrapper.text()).toContain('1539')
    })

    it('displays character aliases when available', async () => {
      charactersStore.characters = [
        { _id: '1', name: 'Luffy', aliases: ['Straw Hat', 'Fifth Emperor'] },
      ]
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Aliases:')
      expect(wrapper.text()).toContain('Straw Hat')
      expect(wrapper.text()).toContain('Fifth Emperor')
    })
  })
})
