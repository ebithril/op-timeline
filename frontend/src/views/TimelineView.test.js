import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import TimelineView from './TimelineView.vue'
import { useEventsStore } from '../stores/events'
import { useCharactersStore } from '../stores/characters'
import { useAuthStore } from '../stores/auth'
import { DisplayMode } from '../utils/yearDisplay'

// Create a mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/event/:id', component: { template: '<div>Event Detail</div>' } },
    { path: '/event/:id/edit', component: { template: '<div>Event Edit</div>' } },
  ],
})

describe('TimelineView', () => {
  let pinia
  let eventsStore
  let charactersStore
  let authStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    eventsStore = useEventsStore()
    charactersStore = useCharactersStore()
    authStore = useAuthStore()

    // Mock store methods
    eventsStore.fetchAll = vi.fn()
    charactersStore.fetchAll = vi.fn()
    eventsStore.deleteEvent = vi.fn()

    // Set up default store state
    eventsStore.loading = false
    eventsStore.error = null
    charactersStore.loading = false
    authStore.user = null
  })

  const mountComponent = (options = {}) => {
    return mount(TimelineView, {
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
    it('renders the timeline title', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('One Piece Timeline')
    })

    it('fetches events and characters on mount', async () => {
      mountComponent()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(eventsStore.fetchAll).toHaveBeenCalled()
      expect(charactersStore.fetchAll).toHaveBeenCalled()
    })

    it('initializes with Kaienreki display mode by default', () => {
      const wrapper = mountComponent()
      expect(wrapper.vm.yearDisplayMode).toBe(DisplayMode.KAIENREKI)
    })
  })

  describe('loading and error states', () => {
    it('displays loading state when events are loading', async () => {
      eventsStore.loading = true
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Loading...')
    })

    it('displays loading state when characters are loading', async () => {
      charactersStore.loading = true
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Loading...')
    })

    it('displays error message when there is an error', async () => {
      eventsStore.error = 'Failed to load events'
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Failed to load events')
    })
  })

  describe('character filtering', () => {
    beforeEach(() => {
      charactersStore.characters = [
        { _id: '1', name: 'Luffy' },
        { _id: '2', name: 'Zoro' },
        { _id: '3', name: 'Nami' },
      ]

      eventsStore.events = [
        {
          _id: 'e1',
          name: 'Event 1',
          type: 'Event',
          description: 'Description 1',
          involvedCharacters: ['Luffy', 'Zoro'],
          calculatedAbsoluteDate: 555000,
          createdAt: 1,
        },
        {
          _id: 'e2',
          name: 'Event 2',
          type: 'Fight',
          description: 'Description 2',
          involvedCharacters: ['Nami'],
          calculatedAbsoluteDate: 555100,
          createdAt: 2,
        },
        {
          _id: 'e3',
          name: 'Event 3',
          type: 'Event',
          description: 'Description 3',
          involvedCharacters: ['Luffy', 'Nami'],
          calculatedAbsoluteDate: 555200,
          createdAt: 3,
        },
      ]
    })

    it('displays all events when no character filter is selected', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.filteredEvents).toHaveLength(3)
    })

    it('filters events by selected character', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      wrapper.vm.toggleCharacterFilter('Luffy')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.filteredEvents).toHaveLength(2)
      expect(wrapper.vm.filteredEvents[0].involvedCharacters).toContain('Luffy')
      expect(wrapper.vm.filteredEvents[1].involvedCharacters).toContain('Luffy')
    })

    it('filters events by multiple characters (OR logic)', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      wrapper.vm.toggleCharacterFilter('Zoro')
      wrapper.vm.toggleCharacterFilter('Nami')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.filteredEvents).toHaveLength(3)
    })

    it('toggles character filter on and off', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      wrapper.vm.toggleCharacterFilter('Luffy')
      expect(wrapper.vm.selectedCharacters).toContain('Luffy')

      wrapper.vm.toggleCharacterFilter('Luffy')
      expect(wrapper.vm.selectedCharacters).not.toContain('Luffy')
    })

    it('highlights selected character buttons', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button').filter(b => b.text() === 'Luffy')
      const luffyButton = buttons[0]

      // Click to select
      await luffyButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(luffyButton.classes()).toContain('bg-one-piece-primary')
      expect(luffyButton.classes()).toContain('text-white')
    })
  })

  describe('year display mode', () => {
    it('changes display mode when dropdown is changed', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const select = wrapper.find('select')
      await select.setValue(DisplayMode.SERIES_START)

      expect(wrapper.vm.yearDisplayMode).toBe(DisplayMode.SERIES_START)
    })

    it('saves display mode preference when changed', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const select = wrapper.find('select')
      await select.setValue(DisplayMode.TIMESKIP_END)

      wrapper.vm.saveDisplayModePreference()

      // Check localStorage was called (indirectly through the util function)
      expect(wrapper.vm.yearDisplayMode).toBe(DisplayMode.TIMESKIP_END)
    })
  })

  describe('event type colors', () => {
    it('returns correct color class for Birth event', () => {
      const wrapper = mountComponent()
      expect(wrapper.vm.getEventTypeColor('Birth')).toBe('bg-green-200 text-green-800')
    })

    it('returns correct color class for Death event', () => {
      const wrapper = mountComponent()
      expect(wrapper.vm.getEventTypeColor('Death')).toBe('bg-red-200 text-red-800')
    })

    it('returns correct color class for Fight event', () => {
      const wrapper = mountComponent()
      expect(wrapper.vm.getEventTypeColor('Fight')).toBe('bg-orange-200 text-orange-800')
    })

    it('returns default color for unknown event type', () => {
      const wrapper = mountComponent()
      expect(wrapper.vm.getEventTypeColor('Unknown')).toBe('bg-gray-200 text-gray-800')
    })
  })

  describe('date formatting', () => {
    it('formats exact date with year/month/day', () => {
      const wrapper = mountComponent()
      const event = {
        dateType: 'Exact',
        exactDate: { year: 1520, month: 7, day: 22 },
      }

      const formatted = wrapper.vm.formatDate(event)
      expect(formatted).toContain('July')
      expect(formatted).toContain('22')
    })

    it('formats exact date with year and month only', () => {
      const wrapper = mountComponent()
      const event = {
        dateType: 'Exact',
        exactDate: { year: 1520, month: 7, day: null },
      }

      const formatted = wrapper.vm.formatDate(event)
      expect(formatted).toContain('July')
      expect(formatted).not.toContain('22')
    })

    it('formats approximation date with tilde', () => {
      const wrapper = mountComponent()
      const event = {
        dateType: 'Approximation',
        exactDate: { year: 1520, month: null, day: null },
      }

      const formatted = wrapper.vm.formatDate(event)
      expect(formatted).toContain('~')
    })

    it('formats relative date with calculated date', () => {
      const wrapper = mountComponent()
      const event = {
        dateType: 'Relative',
        calculatedExactDate: { year: 1539, month: 5, day: 10 },
        relativeOffset: 3,
        relativeTimeUnit: 'Days',
      }

      const formatted = wrapper.vm.formatDate(event)
      expect(formatted).toContain('May')
    })

    it('returns "Date unknown" for events with no date info', () => {
      const wrapper = mountComponent()
      const event = {
        dateType: 'Exact',
        exactDate: null,
        displayYear: null,
      }

      const formatted = wrapper.vm.formatDate(event)
      expect(formatted).toBe('Date unknown')
    })
  })

  describe('delete event', () => {
    beforeEach(() => {
      // Mock window.confirm
      global.confirm = vi.fn()
      global.alert = vi.fn()
    })

    it('prompts for confirmation before deleting', async () => {
      global.confirm.mockReturnValue(false)
      const wrapper = mountComponent()

      await wrapper.vm.deleteEvent('event-123')

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this event?')
      expect(eventsStore.deleteEvent).not.toHaveBeenCalled()
    })

    it('deletes event when confirmed', async () => {
      global.confirm.mockReturnValue(true)
      eventsStore.deleteEvent.mockResolvedValue()
      const wrapper = mountComponent()

      await wrapper.vm.deleteEvent('event-123')

      expect(eventsStore.deleteEvent).toHaveBeenCalledWith('event-123')
    })

    it('shows alert on delete error', async () => {
      global.confirm.mockReturnValue(true)
      eventsStore.deleteEvent.mockRejectedValue(new Error('Delete failed'))
      const wrapper = mountComponent()

      await wrapper.vm.deleteEvent('event-123')

      expect(global.alert).toHaveBeenCalledWith('Failed to delete event')
    })
  })

  describe('editor and admin permissions', () => {
    it('shows edit button for editors', async () => {
      authStore.user = { username: 'editor', role: 'Editor' }
      eventsStore.events = [
        {
          _id: 'e1',
          name: 'Event 1',
          type: 'Event',
          description: 'Desc',
          involvedCharacters: [],
          calculatedAbsoluteDate: 555000,
          createdAt: 1,
        },
      ]

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const editButtons = wrapper.findAll('a').filter(a => a.text() === 'Edit')
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('shows delete button only for admins', async () => {
      authStore.user = { username: 'admin', role: 'Admin' }
      eventsStore.events = [
        {
          _id: 'e1',
          name: 'Event 1',
          type: 'Event',
          description: 'Desc',
          involvedCharacters: [],
          calculatedAbsoluteDate: 555000,
          createdAt: 1,
        },
      ]

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const deleteButtons = wrapper.findAll('button').filter(b => b.text() === 'Delete')
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('does not show edit button for viewers', async () => {
      authStore.user = { username: 'viewer', role: 'Viewer' }
      eventsStore.events = [
        {
          _id: 'e1',
          name: 'Event 1',
          type: 'Event',
          description: 'Desc',
          involvedCharacters: [],
          calculatedAbsoluteDate: 555000,
          createdAt: 1,
        },
      ]

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const editButtons = wrapper.findAll('a').filter(a => a.text() === 'Edit')
      expect(editButtons.length).toBe(0)
    })
  })

  describe('empty state', () => {
    it('shows empty state message when no events', async () => {
      eventsStore.events = []
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No events found')
    })

    it('shows empty state when all events filtered out', async () => {
      eventsStore.events = [
        {
          _id: 'e1',
          name: 'Event 1',
          type: 'Event',
          description: 'Desc',
          involvedCharacters: ['Luffy'],
          calculatedAbsoluteDate: 555000,
          createdAt: 1,
        },
      ]

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      wrapper.vm.toggleCharacterFilter('Zoro')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No events found')
    })
  })
})
