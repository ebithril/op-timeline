import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import EventEditView from './EventEditView.vue'
import { useEventsStore } from '../stores/events'
import { useCharactersStore } from '../stores/characters'
import { useArcsStore } from '../stores/arcs'
import { useLocationsStore } from '../stores/locations'

vi.mock('../services/api')

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'timeline', component: { template: '<div>Timeline</div>' } },
    { path: '/event/new', name: 'event-new', component: { template: '<div>New Event</div>' } },
    { path: '/event/:id/edit', name: 'event-edit', component: { template: '<div>Edit Event</div>' } },
  ],
})

describe('EventEditView', () => {
  let pinia
  let eventsStore
  let charactersStore
  let arcsStore
  let locationsStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    eventsStore = useEventsStore()
    charactersStore = useCharactersStore()
    arcsStore = useArcsStore()
    locationsStore = useLocationsStore()

    // Mock store methods
    eventsStore.fetchAll = vi.fn()
    eventsStore.fetchById = vi.fn()
    eventsStore.create = vi.fn()
    eventsStore.update = vi.fn()
    charactersStore.fetchAll = vi.fn()
    charactersStore.create = vi.fn()
    arcsStore.fetchAll = vi.fn()
    locationsStore.fetchAll = vi.fn()

    // Set up default store state
    eventsStore.events = []
    eventsStore.currentEvent = null
    charactersStore.characters = []
    arcsStore.arcs = []
    locationsStore.locations = []
  })

  const mountComponent = async (options = {}) => {
    const wrapper = mount(EventEditView, {
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
    await wrapper.vm.$nextTick()
    return wrapper
  }

  describe('component mounting and initialization', () => {
    it('renders the create new event title for new events', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      expect(wrapper.text()).toContain('Create New Event')
    })

    it('renders the edit event title for existing events', async () => {
      await router.push('/event/123/edit')
      const wrapper = await mountComponent()

      expect(wrapper.text()).toContain('Edit Event')
    })

    it('fetches all data on mount', async () => {
      await router.push('/event/new')
      await mountComponent()

      expect(eventsStore.fetchAll).toHaveBeenCalled()
      expect(charactersStore.fetchAll).toHaveBeenCalled()
      expect(arcsStore.fetchAll).toHaveBeenCalled()
      expect(locationsStore.fetchAll).toHaveBeenCalled()
    })

    it('initializes with default event data for new events', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      expect(wrapper.vm.eventData.name).toBe('')
      expect(wrapper.vm.eventData.type).toBe('Event')
      expect(wrapper.vm.eventData.dateType).toBe('Exact')
      expect(wrapper.vm.eventData.sources).toHaveLength(1)
      expect(wrapper.vm.eventData.sources[0].isPrimary).toBe(true)
    })

    it('loads existing event data when editing', async () => {
      await router.push('/event/123/edit')
      const mockEvent = {
        _id: '123',
        name: 'Test Event',
        type: 'Fight',
        description: 'Test description',
        dateType: 'Exact',
        exactDate: { year: 1520, month: 5, day: 10 },
        involvedCharacters: [],
        sources: [{ sourceType: 'Chapter', isPrimary: true, chapter: 100 }],
      }
      eventsStore.fetchById.mockImplementation(async () => {
        eventsStore.currentEvent = mockEvent
      })

      const wrapper = await mountComponent()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(eventsStore.fetchById).toHaveBeenCalledWith('123')
      expect(wrapper.vm.eventData.name).toBe('Test Event')
      expect(wrapper.vm.exactDateYear).toBe(1520)
      expect(wrapper.vm.exactDateMonth).toBe(5)
      expect(wrapper.vm.exactDateDay).toBe(10)
    })
  })

  describe('form validation', () => {
    it('validates that at least one source is required', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.eventData.sources = []
      await wrapper.vm.saveEvent()

      expect(wrapper.vm.error).toBe('At least one source is required')
      expect(eventsStore.create).not.toHaveBeenCalled()
    })

    it('validates that at least one primary source is required', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.eventData.sources = [
        { sourceType: 'Chapter', isPrimary: false },
        { sourceType: 'SBS', isPrimary: false },
      ]
      await wrapper.vm.saveEvent()

      expect(wrapper.vm.error).toBe('At least one source must be marked as primary')
      expect(eventsStore.create).not.toHaveBeenCalled()
    })

    it('allows saving with valid sources', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()
      const pushSpy = vi.spyOn(router, 'push')
      eventsStore.create.mockResolvedValue({ _id: 'new-id' })

      wrapper.vm.eventData.name = 'Test Event'
      wrapper.vm.eventData.description = 'Test description'
      wrapper.vm.eventData.sources = [
        { sourceType: 'Chapter', isPrimary: true, chapter: 100 },
      ]

      await wrapper.vm.saveEvent()

      expect(eventsStore.create).toHaveBeenCalled()
      expect(pushSpy).toHaveBeenCalledWith('/')
    })
  })

  describe('date type handling', () => {
    it('shows exact date fields when dateType is Exact', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.eventData.dateType = 'Exact'
      await wrapper.vm.$nextTick()

      const yearInputs = wrapper.findAll('input[type="number"]').filter(w =>
        w.element.placeholder && w.element.placeholder.includes('1500')
      )
      expect(yearInputs.length).toBeGreaterThan(0)
    })

    it('shows relative date fields when dateType is Relative', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.eventData.dateType = 'Relative'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Relative to Event')
      expect(wrapper.text()).toContain('Offset Amount')
    })

    it('updates exactDate when year/month/day change', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.exactDateYear = 1520
      wrapper.vm.exactDateMonth = 5
      wrapper.vm.exactDateDay = 10
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.eventData.exactDate).toEqual({
        year: 1520,
        month: 5,
        day: 10,
      })
    })

    it('sets exactDate to null when year is cleared', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.exactDateYear = 1520
      await wrapper.vm.$nextTick()

      wrapper.vm.exactDateYear = null
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.eventData.exactDate).toBeNull()
    })
  })

  describe('relative year calculation', () => {
    it('calculates absolute year from relative offset', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.useRelativeYearInput = true
      wrapper.vm.referenceYear = 1539
      wrapper.vm.relativeYearOffset = -2
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.calculatedAbsoluteYear).toBe(1537)
    })

    it('syncs absolute year when switching from relative mode', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.useRelativeYearInput = true
      wrapper.vm.referenceYear = 1539
      wrapper.vm.relativeYearOffset = 2
      await wrapper.vm.$nextTick()

      wrapper.vm.useRelativeYearInput = false
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.exactDateYear).toBe(1541)
    })

    it('converts absolute year to relative offset when switching to relative mode', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.exactDateYear = 1541
      wrapper.vm.referenceYear = 1539
      await wrapper.vm.$nextTick()

      wrapper.vm.useRelativeYearInput = true
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.relativeYearOffset).toBe(2)
    })
  })

  describe('vague relative dates', () => {
    it('clears offset when vague mode is enabled', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.vagueOffsetAmount = 5
      wrapper.vm.eventData.relativeOffset = 5
      await wrapper.vm.$nextTick()

      wrapper.vm.isVagueRelative = true
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.eventData.relativeOffset).toBeNull()
      expect(wrapper.vm.vagueOffsetAmount).toBeNull()
    })

    it('sets relativeDirection for vague dates', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.isVagueRelative = true
      wrapper.vm.relativeDirection = 'before'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.eventData.relativeDirection).toBe('Before')
      expect(wrapper.vm.eventData.relativeOffset).toBeNull()
    })

    it('converts direction+amount to signed offset for precise dates', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.isVagueRelative = false
      wrapper.vm.vagueOffsetAmount = 5
      wrapper.vm.relativeDirection = 'before'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.eventData.relativeOffset).toBe(-5)
      expect(wrapper.vm.eventData.relativeDirection).toBeNull()
    })

    it('handles positive offset for after direction', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.isVagueRelative = false
      wrapper.vm.vagueOffsetAmount = 3
      wrapper.vm.relativeDirection = 'after'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.eventData.relativeOffset).toBe(3)
    })
  })

  describe('character autocomplete', () => {
    beforeEach(() => {
      charactersStore.characters = [
        { _id: '1', name: 'Luffy' },
        { _id: '2', name: 'Zoro' },
        { _id: '3', name: 'Nami' },
      ]
    })

    it('filters characters based on search input', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.newCharacter = 'Lu'
      wrapper.vm.filterCharacters()

      expect(wrapper.vm.filteredCharacterSuggestions).toHaveLength(1)
      expect(wrapper.vm.filteredCharacterSuggestions[0].name).toBe('Luffy')
    })

    it('excludes already added characters from suggestions', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.eventData.involvedCharacters = ['Luffy']
      wrapper.vm.newCharacter = 'Lu'
      wrapper.vm.filterCharacters()

      expect(wrapper.vm.filteredCharacterSuggestions).toHaveLength(0)
    })

    it('adds character when selected from suggestions', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      await wrapper.vm.selectCharacter('Luffy')

      expect(wrapper.vm.eventData.involvedCharacters).toContain('Luffy')
      expect(wrapper.vm.newCharacter).toBe('')
      expect(wrapper.vm.showCharacterSuggestions).toBe(false)
    })

    it('does not add duplicate characters', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.eventData.involvedCharacters = ['Luffy']
      await wrapper.vm.selectCharacter('Luffy')

      expect(wrapper.vm.eventData.involvedCharacters).toEqual(['Luffy'])
    })

    it('creates new character if not found', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()
      charactersStore.create.mockResolvedValue({ _id: 'new', name: 'Ace' })

      wrapper.vm.newCharacter = 'Ace'
      await wrapper.vm.addCharacter()

      expect(charactersStore.create).toHaveBeenCalledWith({ name: 'Ace' })
      expect(wrapper.vm.eventData.involvedCharacters).toContain('Ace')
    })

    it('does not create duplicate when adding existing character', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.newCharacter = 'Luffy'
      await wrapper.vm.addCharacter()

      expect(charactersStore.create).not.toHaveBeenCalled()
      expect(wrapper.vm.eventData.involvedCharacters).toContain('Luffy')
    })

    it('removes character at specified index', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.eventData.involvedCharacters = ['Luffy', 'Zoro', 'Nami']
      wrapper.vm.removeCharacter(1)

      expect(wrapper.vm.eventData.involvedCharacters).toEqual(['Luffy', 'Nami'])
    })
  })

  describe('event autocomplete for relative dates', () => {
    beforeEach(() => {
      eventsStore.events = [
        { _id: 'e1', name: 'Battle of Marineford', displayYear: 1520 },
        { _id: 'e2', name: 'Timeskip', displayYear: 1539 },
        { _id: 'e3', name: 'Battle of Dressrosa', displayYear: 1541 },
      ]
    })

    it('filters events based on search input', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.relativeEventSearch = 'Battle'
      wrapper.vm.filterEvents()

      expect(wrapper.vm.filteredEventSuggestions).toHaveLength(2)
    })

    it('excludes current event from suggestions when editing', async () => {
      await router.push('/event/e1/edit')
      const wrapper = await mountComponent()

      wrapper.vm.relativeEventSearch = 'Battle'
      wrapper.vm.filterEvents()

      const ids = wrapper.vm.filteredEventSuggestions.map(e => e._id)
      expect(ids).not.toContain('e1')
    })

    it('selects relative event and updates data', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      const event = { _id: 'e1', name: 'Battle of Marineford', displayYear: 1520 }
      wrapper.vm.selectRelativeEvent(event)

      expect(wrapper.vm.selectedRelativeEvent).toEqual(event)
      expect(wrapper.vm.eventData.relativeEventId).toBe('e1')
      expect(wrapper.vm.relativeEventSearch).toBe('Battle of Marineford')
      expect(wrapper.vm.showEventSuggestions).toBe(false)
    })

    it('clears relative event selection', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.selectedRelativeEvent = { _id: 'e1', name: 'Test' }
      wrapper.vm.eventData.relativeEventId = 'e1'
      wrapper.vm.relativeEventSearch = 'Test'

      wrapper.vm.clearRelativeEvent()

      expect(wrapper.vm.selectedRelativeEvent).toBeNull()
      expect(wrapper.vm.eventData.relativeEventId).toBeNull()
      expect(wrapper.vm.relativeEventSearch).toBe('')
    })
  })

  describe('arc autocomplete', () => {
    beforeEach(() => {
      arcsStore.arcs = [
        { _id: 'a1', name: 'Alabasta Arc', startChapter: 100, endChapter: 200 },
        { _id: 'a2', name: 'Enies Lobby Arc', startChapter: 300, endChapter: 400 },
      ]
    })

    it('filters arcs based on search input', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.arcSearch = 'Alabasta'
      wrapper.vm.filterArcs()

      expect(wrapper.vm.filteredArcSuggestions).toHaveLength(1)
      expect(wrapper.vm.filteredArcSuggestions[0].name).toBe('Alabasta Arc')
    })

    it('selects arc and updates data', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      const arc = { _id: 'a1', name: 'Alabasta Arc', startChapter: 100, endChapter: 200 }
      wrapper.vm.selectArc(arc)

      expect(wrapper.vm.selectedArc).toEqual(arc)
      expect(wrapper.vm.eventData.arcId).toBe('a1')
      expect(wrapper.vm.arcSearch).toBe('Alabasta Arc')
    })

    it('clears arc selection', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.selectedArc = { _id: 'a1', name: 'Test' }
      wrapper.vm.clearArc()

      expect(wrapper.vm.selectedArc).toBeNull()
      expect(wrapper.vm.eventData.arcId).toBeNull()
      expect(wrapper.vm.arcSearch).toBe('')
    })
  })

  describe('parent event autocomplete', () => {
    beforeEach(() => {
      eventsStore.events = [
        { _id: 'e1', name: 'Summit War', displayYear: 1520 },
        { _id: 'e2', name: 'Battle at the Summit', displayYear: 1520 },
      ]
    })

    it('filters parent events based on search', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.parentEventSearch = 'Summit'
      wrapper.vm.filterParentEvents()

      expect(wrapper.vm.filteredParentEventSuggestions).toHaveLength(2)
    })

    it('selects parent event and updates data', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      const event = { _id: 'e1', name: 'Summit War', displayYear: 1520 }
      wrapper.vm.selectParentEvent(event)

      expect(wrapper.vm.selectedParentEvent).toEqual(event)
      expect(wrapper.vm.eventData.parentEventId).toBe('e1')
    })

    it('clears parent event selection', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.selectedParentEvent = { _id: 'e1', name: 'Test' }
      wrapper.vm.clearParentEvent()

      expect(wrapper.vm.selectedParentEvent).toBeNull()
      expect(wrapper.vm.eventData.parentEventId).toBeNull()
      expect(wrapper.vm.parentEventSearch).toBe('')
    })
  })

  describe('location autocomplete', () => {
    beforeEach(() => {
      locationsStore.locations = [
        { _id: 'l1', name: 'Water 7', type: 'CityTownVillage' },
        { _id: 'l2', name: 'East Blue', type: 'Sea' },
      ]
    })

    it('filters locations based on search', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.locationSearch = 'Water'
      wrapper.vm.filterLocations()

      expect(wrapper.vm.filteredLocationSuggestions).toHaveLength(1)
      expect(wrapper.vm.filteredLocationSuggestions[0].name).toBe('Water 7')
    })

    it('selects location and updates data', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      const location = { _id: 'l1', name: 'Water 7', type: 'CityTownVillage' }
      wrapper.vm.selectLocation(location)

      expect(wrapper.vm.selectedLocation).toEqual(location)
      expect(wrapper.vm.eventData.locationId).toBe('l1')
    })

    it('clears location selection', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.selectedLocation = { _id: 'l1', name: 'Test' }
      wrapper.vm.clearLocation()

      expect(wrapper.vm.selectedLocation).toBeNull()
      expect(wrapper.vm.eventData.locationId).toBeNull()
      expect(wrapper.vm.locationSearch).toBe('')
    })

    it('formats location type correctly', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      expect(wrapper.vm.formatLocationType('CityTownVillage')).toBe('City/Town/Village')
      expect(wrapper.vm.formatLocationType('Sea')).toBe('Sea')
      expect(wrapper.vm.formatLocationType('Island')).toBe('Island')
    })
  })

  describe('source management', () => {
    it('adds a new source', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      const initialLength = wrapper.vm.eventData.sources.length
      wrapper.vm.addSource()

      expect(wrapper.vm.eventData.sources).toHaveLength(initialLength + 1)
      expect(wrapper.vm.eventData.sources[initialLength].isPrimary).toBe(false)
    })

    it('removes a source', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.eventData.sources = [
        { sourceType: 'Chapter', isPrimary: true },
        { sourceType: 'SBS', isPrimary: false },
      ]

      wrapper.vm.removeSource(1)

      expect(wrapper.vm.eventData.sources).toHaveLength(1)
      expect(wrapper.vm.eventData.sources[0].sourceType).toBe('Chapter')
    })

    it('does not remove the last source', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      wrapper.vm.eventData.sources = [{ sourceType: 'Chapter', isPrimary: true }]
      wrapper.vm.removeSource(0)

      expect(wrapper.vm.eventData.sources).toHaveLength(1)
    })
  })

  describe('save event', () => {
    it('creates new event when in create mode', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()
      const pushSpy = vi.spyOn(router, 'push')
      eventsStore.create.mockResolvedValue({ _id: 'new-id' })

      wrapper.vm.eventData.name = 'New Event'
      wrapper.vm.eventData.description = 'Description'
      wrapper.vm.eventData.sources = [{ sourceType: 'Chapter', isPrimary: true }]

      await wrapper.vm.saveEvent()

      expect(eventsStore.create).toHaveBeenCalled()
      expect(pushSpy).toHaveBeenCalledWith('/')
    })

    it('updates existing event when in edit mode', async () => {
      await router.push('/event/123/edit')
      eventsStore.currentEvent = {
        _id: '123',
        name: 'Existing Event',
        type: 'Event',
        description: 'Test',
        sources: [{ sourceType: 'Chapter', isPrimary: true }],
      }
      const wrapper = await mountComponent()
      const pushSpy = vi.spyOn(router, 'push')
      eventsStore.update.mockResolvedValue({ _id: '123' })

      wrapper.vm.eventData.name = 'Updated Event'
      await wrapper.vm.saveEvent()

      expect(eventsStore.update).toHaveBeenCalledWith('123', expect.objectContaining({
        name: 'Updated Event',
      }))
      expect(pushSpy).toHaveBeenCalledWith('/')
    })

    it('handles save error', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()
      eventsStore.create.mockRejectedValue({
        response: { data: { error: 'Validation failed' } },
      })

      wrapper.vm.eventData.name = 'Test'
      wrapper.vm.eventData.description = 'Test'
      wrapper.vm.eventData.sources = [{ sourceType: 'Chapter', isPrimary: true }]

      await wrapper.vm.saveEvent()

      expect(wrapper.vm.error).toBe('Validation failed')
      expect(wrapper.vm.loading).toBe(false)
    })

    it('handles save error without response data', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()
      eventsStore.create.mockRejectedValue(new Error('Network error'))

      wrapper.vm.eventData.name = 'Test'
      wrapper.vm.eventData.description = 'Test'
      wrapper.vm.eventData.sources = [{ sourceType: 'Chapter', isPrimary: true }]

      await wrapper.vm.saveEvent()

      expect(wrapper.vm.error).toBe('Failed to save event')
    })

    it('sets loading state during save', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()
      let resolveCreate
      eventsStore.create.mockImplementation(() => new Promise(resolve => {
        resolveCreate = resolve
      }))

      wrapper.vm.eventData.name = 'Test'
      wrapper.vm.eventData.description = 'Test'
      wrapper.vm.eventData.sources = [{ sourceType: 'Chapter', isPrimary: true }]

      const savePromise = wrapper.vm.saveEvent()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.loading).toBe(true)

      resolveCreate({ _id: 'new-id' })
      await savePromise

      expect(wrapper.vm.loading).toBe(false)
    })
  })

  describe('loading existing event data', () => {
    it('loads vague relative date from existing event', async () => {
      await router.push('/event/123/edit')
      eventsStore.events = [
        { _id: 'e1', name: 'Reference Event', displayYear: 1520 },
      ]
      const mockEvent = {
        _id: '123',
        name: 'Test Event',
        type: 'Event',
        description: 'Test',
        dateType: 'Relative',
        relativeEventId: 'e1',
        relativeTimeUnit: 'Days',
        relativeOffset: null,
        relativeDirection: 'Before',
        sources: [{ sourceType: 'Chapter', isPrimary: true }],
      }
      eventsStore.fetchById.mockImplementation(async () => {
        eventsStore.currentEvent = mockEvent
      })

      const wrapper = await mountComponent()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.isVagueRelative).toBe(true)
      expect(wrapper.vm.relativeDirection).toBe('before')
      expect(wrapper.vm.selectedRelativeEvent.name).toBe('Reference Event')
    })

    it('loads precise relative date from existing event', async () => {
      await router.push('/event/123/edit')
      eventsStore.events = [
        { _id: 'e1', name: 'Reference Event', displayYear: 1520 },
      ]
      const mockEvent = {
        _id: '123',
        name: 'Test Event',
        type: 'Event',
        description: 'Test',
        dateType: 'Relative',
        relativeEventId: 'e1',
        relativeTimeUnit: 'Days',
        relativeOffset: -5,
        sources: [{ sourceType: 'Chapter', isPrimary: true }],
      }
      eventsStore.fetchById.mockImplementation(async () => {
        eventsStore.currentEvent = mockEvent
      })

      const wrapper = await mountComponent()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.isVagueRelative).toBe(false)
      expect(wrapper.vm.vagueOffsetAmount).toBe(5)
      expect(wrapper.vm.relativeDirection).toBe('before')
    })

    it('loads selected arc from existing event', async () => {
      await router.push('/event/123/edit')
      arcsStore.arcs = [
        { _id: 'a1', name: 'Alabasta Arc', startChapter: 100, endChapter: 200 },
      ]
      const mockEvent = {
        _id: '123',
        name: 'Test Event',
        type: 'Event',
        description: 'Test',
        arcId: 'a1',
        sources: [{ sourceType: 'Chapter', isPrimary: true }],
      }
      eventsStore.fetchById.mockImplementation(async () => {
        eventsStore.currentEvent = mockEvent
      })

      const wrapper = await mountComponent()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.selectedArc.name).toBe('Alabasta Arc')
      expect(wrapper.vm.arcSearch).toBe('Alabasta Arc')
    })

    it('loads selected parent event from existing event', async () => {
      await router.push('/event/123/edit')
      eventsStore.events = [
        { _id: 'p1', name: 'Parent Event', displayYear: 1520 },
      ]
      const mockEvent = {
        _id: '123',
        name: 'Test Event',
        type: 'Event',
        description: 'Test',
        parentEventId: 'p1',
        sources: [{ sourceType: 'Chapter', isPrimary: true }],
      }
      eventsStore.fetchById.mockImplementation(async () => {
        eventsStore.currentEvent = mockEvent
      })

      const wrapper = await mountComponent()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.selectedParentEvent.name).toBe('Parent Event')
      expect(wrapper.vm.parentEventSearch).toBe('Parent Event')
    })

    it('loads selected location from existing event', async () => {
      await router.push('/event/123/edit')
      locationsStore.locations = [
        { _id: 'l1', name: 'Water 7', type: 'CityTownVillage' },
      ]
      const mockEvent = {
        _id: '123',
        name: 'Test Event',
        type: 'Event',
        description: 'Test',
        locationId: 'l1',
        sources: [{ sourceType: 'Chapter', isPrimary: true }],
      }
      eventsStore.fetchById.mockImplementation(async () => {
        eventsStore.currentEvent = mockEvent
      })

      const wrapper = await mountComponent()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.selectedLocation.name).toBe('Water 7')
      expect(wrapper.vm.locationSearch).toBe('Water 7')
    })

    it('ensures at least one source when loading event without sources', async () => {
      await router.push('/event/123/edit')
      eventsStore.currentEvent = {
        _id: '123',
        name: 'Test Event',
        type: 'Event',
        description: 'Test',
        sources: [],
      }

      const wrapper = await mountComponent()

      expect(wrapper.vm.eventData.sources).toHaveLength(1)
      expect(wrapper.vm.eventData.sources[0].isPrimary).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('correctly identifies new event', async () => {
      await router.push('/event/new')
      const wrapper = await mountComponent()

      expect(wrapper.vm.isNewEvent).toBe(true)
    })

    it('correctly identifies edit event', async () => {
      await router.push('/event/123/edit')
      const wrapper = await mountComponent()

      expect(wrapper.vm.isNewEvent).toBe(false)
    })
  })
})
