import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ErasView from './ErasView.vue'
import { useErasStore } from '../stores/eras'
import { useAuthStore } from '../stores/auth'
import { erasAPI } from '../services/api'

vi.mock('../services/api')

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/eras', component: { template: '<div>Eras</div>' } },
    { path: '/eras/new', component: { template: '<div>New Era</div>' } },
    { path: '/eras/:id', component: { template: '<div>Era Detail</div>' } },
    { path: '/eras/:id/edit', component: { template: '<div>Era Edit</div>' } },
  ],
})

describe('ErasView', () => {
  let pinia
  let erasStore
  let authStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    erasStore = useErasStore()
    authStore = useAuthStore()

    // Mock store methods
    erasStore.fetchAll = vi.fn()
    erasStore.deleteEra = vi.fn()

    // Set up default store state
    erasStore.loading = false
    erasStore.error = null
    erasStore.eras = []
    authStore.user = null

    // Mock API
    erasAPI.getTimeline = vi.fn()
  })

  const mountComponent = (options = {}) => {
    return mount(ErasView, {
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
    it('renders the eras title', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Eras')
    })

    it('fetches eras on mount', async () => {
      mountComponent()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(erasStore.fetchAll).toHaveBeenCalled()
    })

    it('shows Create New Era button when user is editor', async () => {
      authStore.user = { role: 'Editor' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Create New Era')
    })

    it('hides Create New Era button when user is not authenticated', async () => {
      authStore.user = null
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Create New Era')
    })
  })

  describe('loading and error states', () => {
    it('displays loading state', async () => {
      erasStore.loading = true
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Loading eras...')
    })

    it('displays error message', async () => {
      erasStore.error = 'Failed to load eras'
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Failed to load eras')
    })
  })

  describe('formatEraDate function', () => {
    it('formats approximation date type with description', () => {
      const wrapper = mountComponent()
      const era = {
        startDateType: 'Approximation',
        startApproximateDescription: 'Long ago',
      }

      const formatted = wrapper.vm.formatEraDate(era, 'start')
      expect(formatted).toBe('Long ago')
    })

    it('returns Unknown for approximation without description', () => {
      const wrapper = mountComponent()
      const era = {
        startDateType: 'Approximation',
        startApproximateDescription: null,
      }

      const formatted = wrapper.vm.formatEraDate(era, 'start')
      expect(formatted).toBe('Unknown')
    })

    it('formats exact date with year, month, and day', () => {
      const wrapper = mountComponent()
      const era = {
        startDateType: 'Exact',
        startDate: { year: 1500, month: 6, day: 15 },
      }

      const formatted = wrapper.vm.formatEraDate(era, 'start')
      expect(formatted).toBe('Year 1500, Month 6, Day 15')
    })

    it('formats exact date with only year', () => {
      const wrapper = mountComponent()
      const era = {
        startDateType: 'Exact',
        startDate: { year: 1500 },
      }

      const formatted = wrapper.vm.formatEraDate(era, 'start')
      expect(formatted).toBe('Year 1500')
    })

    it('formats exact date with year and month', () => {
      const wrapper = mountComponent()
      const era = {
        startDateType: 'Exact',
        startDate: { year: 1500, month: 6 },
      }

      const formatted = wrapper.vm.formatEraDate(era, 'start')
      expect(formatted).toBe('Year 1500, Month 6')
    })

    it('formats relative date with calculated exact date', () => {
      const wrapper = mountComponent()
      const era = {
        startDateType: 'Relative',
        startCalculatedExactDate: { year: 1550, month: 3, day: 20 },
      }

      const formatted = wrapper.vm.formatEraDate(era, 'start')
      expect(formatted).toBe('Year 1550, Month 3, Day 20')
    })

    it('formats relative date falling back to direct date', () => {
      const wrapper = mountComponent()
      const era = {
        startDateType: 'Relative',
        startCalculatedExactDate: null,
        startDate: { year: 1500, month: 1, day: 1 },
      }

      const formatted = wrapper.vm.formatEraDate(era, 'start')
      expect(formatted).toBe('Year 1500, Month 1, Day 1')
    })

    it('formats date using display year when date object not available', () => {
      const wrapper = mountComponent()
      const era = {
        startDateType: 'Relative',
        startCalculatedExactDate: null,
        startDate: null,
        startDisplayYear: 1525,
      }

      const formatted = wrapper.vm.formatEraDate(era, 'start')
      expect(formatted).toBe('Year 1525')
    })

    it('returns Unknown when no date information available', () => {
      const wrapper = mountComponent()
      const era = {
        startDateType: 'Relative',
        startCalculatedExactDate: null,
        startDate: null,
        startDisplayYear: null,
      }

      const formatted = wrapper.vm.formatEraDate(era, 'start')
      expect(formatted).toBe('Unknown')
    })

    it('formats end date with approximation type', () => {
      const wrapper = mountComponent()
      const era = {
        endDateType: 'Approximation',
        endApproximateDescription: 'Modern times',
      }

      const formatted = wrapper.vm.formatEraDate(era, 'end')
      expect(formatted).toBe('Modern times')
    })

    it('formats end date with exact type', () => {
      const wrapper = mountComponent()
      const era = {
        endDateType: 'Exact',
        endDate: { year: 1600, month: 12, day: 31 },
      }

      const formatted = wrapper.vm.formatEraDate(era, 'end')
      expect(formatted).toBe('Year 1600, Month 12, Day 31')
    })

    it('formats end date with relative type using calculated date', () => {
      const wrapper = mountComponent()
      const era = {
        endDateType: 'Relative',
        endCalculatedExactDate: { year: 1650, month: 8, day: 10 },
      }

      const formatted = wrapper.vm.formatEraDate(era, 'end')
      expect(formatted).toBe('Year 1650, Month 8, Day 10')
    })

    it('formats end date using display year', () => {
      const wrapper = mountComponent()
      const era = {
        endDateType: 'Relative',
        endCalculatedExactDate: null,
        endDate: null,
        endDisplayYear: 1700,
      }

      const formatted = wrapper.vm.formatEraDate(era, 'end')
      expect(formatted).toBe('Year 1700')
    })
  })

  describe('timeline toggle functionality', () => {
    beforeEach(() => {
      erasStore.eras = [
        { _id: 'era1', name: 'Golden Age', startDate: { year: 1500 }, endDate: { year: 1600 } },
      ]
    })

    it('timeline is hidden by default', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showingTimeline['era1']).toBeFalsy()
    })

    it('toggles timeline visibility', async () => {
      erasAPI.getTimeline.mockResolvedValue({ data: [] })
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      await wrapper.vm.toggleTimeline('era1')

      expect(wrapper.vm.showingTimeline['era1']).toBe(true)

      await wrapper.vm.toggleTimeline('era1')

      expect(wrapper.vm.showingTimeline['era1']).toBe(false)
    })

    it('fetches timeline data when shown for first time', async () => {
      const mockEvents = [
        { _id: 'e1', name: 'Event 1', displayYear: 1550 },
      ]
      erasAPI.getTimeline.mockResolvedValue({ data: mockEvents })

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      await wrapper.vm.toggleTimeline('era1')

      expect(erasAPI.getTimeline).toHaveBeenCalledWith('era1')
      expect(wrapper.vm.eraTimelines['era1']).toEqual(mockEvents)
    })

    it('does not re-fetch timeline when toggled again', async () => {
      erasAPI.getTimeline.mockResolvedValue({ data: [] })

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      await wrapper.vm.toggleTimeline('era1')
      expect(erasAPI.getTimeline).toHaveBeenCalledTimes(1)

      await wrapper.vm.toggleTimeline('era1')
      await wrapper.vm.toggleTimeline('era1')

      expect(erasAPI.getTimeline).toHaveBeenCalledTimes(1)
    })

    it('shows loading state while fetching timeline', async () => {
      erasAPI.getTimeline.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
      )

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const togglePromise = wrapper.vm.toggleTimeline('era1')

      expect(wrapper.vm.loadingTimelines['era1']).toBe(true)

      await togglePromise

      expect(wrapper.vm.loadingTimelines['era1']).toBe(false)
    })

    it('handles timeline fetch error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      erasAPI.getTimeline.mockRejectedValue(new Error('Fetch failed'))

      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      await wrapper.vm.toggleTimeline('era1')

      expect(wrapper.vm.eraTimelines['era1']).toEqual([])
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('delete era', () => {
    beforeEach(() => {
      global.confirm = vi.fn()
      global.alert = vi.fn()
      erasStore.eras = [
        { _id: 'era1', name: 'Golden Age', startDate: { year: 1500 } },
      ]
    })

    it('prompts for confirmation before deleting', async () => {
      global.confirm.mockReturnValue(false)
      const wrapper = mountComponent()
      const era = erasStore.eras[0]

      await wrapper.vm.confirmDelete(era)

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete the era "Golden Age"?')
      expect(erasStore.deleteEra).not.toHaveBeenCalled()
    })

    it('deletes era when confirmed', async () => {
      global.confirm.mockReturnValue(true)
      erasStore.deleteEra.mockResolvedValue()
      const wrapper = mountComponent()
      const era = erasStore.eras[0]

      await wrapper.vm.confirmDelete(era)

      expect(erasStore.deleteEra).toHaveBeenCalledWith('era1')
    })

    it('shows alert on delete error', async () => {
      global.confirm.mockReturnValue(true)
      erasStore.deleteEra.mockRejectedValue(new Error('Delete failed'))
      const wrapper = mountComponent()
      const era = erasStore.eras[0]

      await wrapper.vm.confirmDelete(era)

      expect(global.alert).toHaveBeenCalledWith('Failed to delete era')
    })
  })

  describe('era action buttons', () => {
    beforeEach(() => {
      erasStore.eras = [
        { _id: 'era1', name: 'Golden Age', startDate: { year: 1500 }, endDate: { year: 1600 } },
      ]
    })

    it('shows edit button for all eras when user is editor', async () => {
      authStore.user = { role: 'Editor' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const editButtons = wrapper.findAll('a').filter(a => a.text() === 'Edit')
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('hides edit button when user is not authenticated', async () => {
      authStore.user = null
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const editButtons = wrapper.findAll('a').filter(a => a.text() === 'Edit')
      expect(editButtons.length).toBe(0)
    })

    it('shows delete button for all eras when user is admin', async () => {
      authStore.user = { role: 'Admin' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const deleteButtons = wrapper.findAll('button').filter(b => b.text() === 'Delete')
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('hides delete button when user is not admin', async () => {
      authStore.user = { role: 'Editor' }
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const deleteButtons = wrapper.findAll('button').filter(b => b.text() === 'Delete')
      expect(deleteButtons.length).toBe(0)
    })

    it('shows view timeline button for all eras', async () => {
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      const timelineButtons = wrapper.findAll('button').filter(b => b.text() === 'View Timeline')
      expect(timelineButtons.length).toBeGreaterThan(0)
    })
  })

  describe('empty state', () => {
    it('shows empty state message when no eras', async () => {
      erasStore.eras = []
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No eras found')
    })
  })

  describe('era display', () => {
    it('displays era with relative dates indicator', async () => {
      erasStore.eras = [
        {
          _id: 'era1',
          name: 'Relative Era',
          startDateType: 'Relative',
          endDateType: 'Exact',
          startDisplayYear: 1500,
          endDate: { year: 1600 },
        },
      ]
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('(Contains relative dates)')
    })

    it('displays era with both start and end relative dates', async () => {
      erasStore.eras = [
        {
          _id: 'era1',
          name: 'Fully Relative Era',
          startDateType: 'Relative',
          endDateType: 'Relative',
          startDisplayYear: 1500,
          endDisplayYear: 1600,
        },
      ]
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('(Contains relative dates)')
    })

    it('does not show relative dates indicator for exact dates', async () => {
      erasStore.eras = [
        {
          _id: 'era1',
          name: 'Exact Era',
          startDateType: 'Exact',
          endDateType: 'Exact',
          startDate: { year: 1500 },
          endDate: { year: 1600 },
        },
      ]
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('(Contains relative dates)')
    })

    it('displays era description when available', async () => {
      erasStore.eras = [
        {
          _id: 'era1',
          name: 'Golden Age',
          description: 'A time of peace and prosperity',
          startDate: { year: 1500 },
          endDate: { year: 1600 },
        },
      ]
      const wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('A time of peace and prosperity')
    })
  })
})
