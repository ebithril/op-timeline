import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventsStore } from './events'
import { eventsAPI } from '../services/api'

vi.mock('../services/api')

describe('useEventsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty events array', () => {
      const store = useEventsStore()
      expect(store.events).toEqual([])
    })

    it('initializes with null currentEvent', () => {
      const store = useEventsStore()
      expect(store.currentEvent).toBeNull()
    })

    it('initializes with empty eventHistory', () => {
      const store = useEventsStore()
      expect(store.eventHistory).toEqual([])
    })

    it('initializes with loading false', () => {
      const store = useEventsStore()
      expect(store.loading).toBe(false)
    })

    it('initializes with null error', () => {
      const store = useEventsStore()
      expect(store.error).toBeNull()
    })
  })

  describe('sortedEvents computed', () => {
    it('sorts events by calculatedAbsoluteDate', () => {
      const store = useEventsStore()
      store.events = [
        { _id: '1', calculatedAbsoluteDate: 555000, createdAt: 3 },
        { _id: '2', calculatedAbsoluteDate: 554000, createdAt: 1 },
        { _id: '3', calculatedAbsoluteDate: 556000, createdAt: 2 },
      ]

      expect(store.sortedEvents).toEqual([
        { _id: '2', calculatedAbsoluteDate: 554000, createdAt: 1 },
        { _id: '1', calculatedAbsoluteDate: 555000, createdAt: 3 },
        { _id: '3', calculatedAbsoluteDate: 556000, createdAt: 2 },
      ])
    })

    it('sorts by chapter when dates are equal', () => {
      const store = useEventsStore()
      store.events = [
        { _id: '1', calculatedAbsoluteDate: 555000, chapter: 100, createdAt: 3 },
        { _id: '2', calculatedAbsoluteDate: 555000, chapter: 50, createdAt: 1 },
        { _id: '3', calculatedAbsoluteDate: 555000, chapter: 75, createdAt: 2 },
      ]

      expect(store.sortedEvents).toEqual([
        { _id: '2', calculatedAbsoluteDate: 555000, chapter: 50, createdAt: 1 },
        { _id: '3', calculatedAbsoluteDate: 555000, chapter: 75, createdAt: 2 },
        { _id: '1', calculatedAbsoluteDate: 555000, chapter: 100, createdAt: 3 },
      ])
    })

    it('sorts by createdAt when dates and chapters are equal', () => {
      const store = useEventsStore()
      store.events = [
        { _id: '1', calculatedAbsoluteDate: 555000, chapter: 100, createdAt: 3 },
        { _id: '2', calculatedAbsoluteDate: 555000, chapter: 100, createdAt: 1 },
        { _id: '3', calculatedAbsoluteDate: 555000, chapter: 100, createdAt: 2 },
      ]

      expect(store.sortedEvents).toEqual([
        { _id: '2', calculatedAbsoluteDate: 555000, chapter: 100, createdAt: 1 },
        { _id: '3', calculatedAbsoluteDate: 555000, chapter: 100, createdAt: 2 },
        { _id: '1', calculatedAbsoluteDate: 555000, chapter: 100, createdAt: 3 },
      ])
    })

    it('puts events with dates before events without dates', () => {
      const store = useEventsStore()
      store.events = [
        { _id: '1', calculatedAbsoluteDate: null, createdAt: 1 },
        { _id: '2', calculatedAbsoluteDate: 555000, createdAt: 2 },
        { _id: '3', calculatedAbsoluteDate: null, createdAt: 3 },
      ]

      expect(store.sortedEvents[0]._id).toBe('2')
      expect(store.sortedEvents[1]._id).toBe('1')
      expect(store.sortedEvents[2]._id).toBe('3')
    })

    it('sorts by chapter when no dates available', () => {
      const store = useEventsStore()
      store.events = [
        { _id: '1', calculatedAbsoluteDate: null, chapter: 100, createdAt: 3 },
        { _id: '2', calculatedAbsoluteDate: null, chapter: 50, createdAt: 1 },
        { _id: '3', calculatedAbsoluteDate: null, chapter: 75, createdAt: 2 },
      ]

      expect(store.sortedEvents).toEqual([
        { _id: '2', calculatedAbsoluteDate: null, chapter: 50, createdAt: 1 },
        { _id: '3', calculatedAbsoluteDate: null, chapter: 75, createdAt: 2 },
        { _id: '1', calculatedAbsoluteDate: null, chapter: 100, createdAt: 3 },
      ])
    })

    it('sorts by createdAt when no dates or chapters', () => {
      const store = useEventsStore()
      store.events = [
        { _id: '1', calculatedAbsoluteDate: null, chapter: null, createdAt: 3 },
        { _id: '2', calculatedAbsoluteDate: null, chapter: null, createdAt: 1 },
        { _id: '3', calculatedAbsoluteDate: null, chapter: null, createdAt: 2 },
      ]

      expect(store.sortedEvents).toEqual([
        { _id: '2', calculatedAbsoluteDate: null, chapter: null, createdAt: 1 },
        { _id: '3', calculatedAbsoluteDate: null, chapter: null, createdAt: 2 },
        { _id: '1', calculatedAbsoluteDate: null, chapter: null, createdAt: 3 },
      ])
    })

    it('does not mutate original events array', () => {
      const store = useEventsStore()
      store.events = [
        { _id: '1', calculatedAbsoluteDate: 555000, createdAt: 2 },
        { _id: '2', calculatedAbsoluteDate: 554000, createdAt: 1 },
      ]

      const originalOrder = store.events[0]._id
      store.sortedEvents // Access computed property

      expect(store.events[0]._id).toBe(originalOrder)
    })
  })

  describe('fetchAll', () => {
    it('fetches all events successfully', async () => {
      const store = useEventsStore()
      const mockEvents = [
        { _id: '1', name: 'Event 1' },
        { _id: '2', name: 'Event 2' },
      ]

      eventsAPI.getAll = vi.fn().mockResolvedValue({ data: mockEvents })

      await store.fetchAll()

      expect(store.events).toEqual(mockEvents)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets loading to true during fetch', async () => {
      const store = useEventsStore()
      eventsAPI.getAll = vi.fn().mockResolvedValue({ data: [] })

      const promise = store.fetchAll()
      expect(store.loading).toBe(true)
      await promise
    })

    it('sets error on fetch failure', async () => {
      const store = useEventsStore()
      eventsAPI.getAll = vi.fn().mockRejectedValue({
        response: { data: { error: 'Network error' } },
      })

      await store.fetchAll()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })

    it('uses default error message when response has no error', async () => {
      const store = useEventsStore()
      eventsAPI.getAll = vi.fn().mockRejectedValue({})

      await store.fetchAll()

      expect(store.error).toBe('Failed to fetch events')
    })
  })

  describe('fetchById', () => {
    it('fetches event by id successfully', async () => {
      const store = useEventsStore()
      const mockEvent = { _id: '123', name: 'Test Event' }

      eventsAPI.getById = vi.fn().mockResolvedValue({ data: mockEvent })

      await store.fetchById('123')

      expect(store.currentEvent).toEqual(mockEvent)
      expect(eventsAPI.getById).toHaveBeenCalledWith('123')
    })

    it('sets error on fetch failure', async () => {
      const store = useEventsStore()
      eventsAPI.getById = vi.fn().mockRejectedValue({
        response: { data: { error: 'Not found' } },
      })

      await store.fetchById('123')

      expect(store.error).toBe('Not found')
    })
  })

  describe('fetchByCharacter', () => {
    it('fetches events by character name', async () => {
      const store = useEventsStore()
      const mockEvents = [
        { _id: '1', name: 'Event 1', involvedCharacters: ['Luffy'] },
        { _id: '2', name: 'Event 2', involvedCharacters: ['Luffy'] },
      ]

      eventsAPI.getByCharacter = vi.fn().mockResolvedValue({ data: mockEvents })

      await store.fetchByCharacter('Luffy')

      expect(store.events).toEqual(mockEvents)
      expect(eventsAPI.getByCharacter).toHaveBeenCalledWith('Luffy')
    })

    it('sets error on fetch failure', async () => {
      const store = useEventsStore()
      eventsAPI.getByCharacter = vi.fn().mockRejectedValue({
        response: { data: { error: 'Character not found' } },
      })

      await store.fetchByCharacter('Unknown')

      expect(store.error).toBe('Character not found')
    })
  })

  describe('create', () => {
    it('creates event successfully', async () => {
      const store = useEventsStore()
      const newEvent = { name: 'New Event', description: 'Test' }
      const createdEvent = { _id: '123', ...newEvent }

      eventsAPI.create = vi.fn().mockResolvedValue({ data: createdEvent })

      const result = await store.create(newEvent)

      expect(result).toEqual(createdEvent)
      expect(store.events).toContainEqual(createdEvent)
      expect(eventsAPI.create).toHaveBeenCalledWith(newEvent)
    })

    it('throws error on create failure', async () => {
      const store = useEventsStore()
      const newEvent = { name: 'New Event' }

      eventsAPI.create = vi.fn().mockRejectedValue({
        response: { data: { error: 'Validation failed' } },
      })

      await expect(store.create(newEvent)).rejects.toThrow()
      expect(store.error).toBe('Validation failed')
    })
  })

  describe('update', () => {
    it('updates event successfully', async () => {
      const store = useEventsStore()
      store.events = [
        { _id: '123', name: 'Old Name' },
        { _id: '456', name: 'Other Event' },
      ]

      const updatedEvent = { _id: '123', name: 'New Name' }
      eventsAPI.update = vi.fn().mockResolvedValue({ data: updatedEvent })

      const result = await store.update('123', updatedEvent)

      expect(result).toEqual(updatedEvent)
      expect(store.events[0]).toEqual(updatedEvent)
      expect(eventsAPI.update).toHaveBeenCalledWith('123', updatedEvent)
    })

    it('handles update when event not in local array', async () => {
      const store = useEventsStore()
      store.events = [{ _id: '456', name: 'Other Event' }]

      const updatedEvent = { _id: '123', name: 'New Name' }
      eventsAPI.update = vi.fn().mockResolvedValue({ data: updatedEvent })

      const result = await store.update('123', updatedEvent)

      expect(result).toEqual(updatedEvent)
      // Event array should remain unchanged since event not found
      expect(store.events).toHaveLength(1)
    })

    it('throws error on update failure', async () => {
      const store = useEventsStore()
      eventsAPI.update = vi.fn().mockRejectedValue({
        response: { data: { error: 'Update failed' } },
      })

      await expect(store.update('123', {})).rejects.toThrow()
      expect(store.error).toBe('Update failed')
    })
  })

  describe('deleteEvent', () => {
    it('deletes event successfully', async () => {
      const store = useEventsStore()
      store.events = [
        { _id: '123', name: 'Event to delete' },
        { _id: '456', name: 'Other Event' },
      ]

      eventsAPI.delete = vi.fn().mockResolvedValue({})

      await store.deleteEvent('123')

      expect(store.events).toHaveLength(1)
      expect(store.events[0]._id).toBe('456')
      expect(eventsAPI.delete).toHaveBeenCalledWith('123')
    })

    it('throws error on delete failure', async () => {
      const store = useEventsStore()
      eventsAPI.delete = vi.fn().mockRejectedValue({
        response: { data: { error: 'Delete failed' } },
      })

      await expect(store.deleteEvent('123')).rejects.toThrow()
      expect(store.error).toBe('Delete failed')
    })
  })

  describe('fetchHistory', () => {
    it('fetches event history successfully', async () => {
      const store = useEventsStore()
      const mockHistory = [
        { version: 2, event: { name: 'Version 2' } },
        { version: 1, event: { name: 'Version 1' } },
      ]

      eventsAPI.getHistory = vi.fn().mockResolvedValue({ data: mockHistory })

      await store.fetchHistory('123')

      expect(store.eventHistory).toEqual(mockHistory)
      expect(eventsAPI.getHistory).toHaveBeenCalledWith('123')
    })

    it('sets error on fetch history failure', async () => {
      const store = useEventsStore()
      eventsAPI.getHistory = vi.fn().mockRejectedValue({
        response: { data: { error: 'History not found' } },
      })

      await store.fetchHistory('123')

      expect(store.error).toBe('History not found')
    })
  })

  describe('revertToVersion', () => {
    it('reverts event to previous version successfully', async () => {
      const store = useEventsStore()
      store.events = [
        { _id: '123', name: 'Current Version', version: 3 },
        { _id: '456', name: 'Other Event' },
      ]

      const revertedEvent = { _id: '123', name: 'Version 1', version: 4 }
      eventsAPI.revert = vi.fn().mockResolvedValue({ data: revertedEvent })

      const result = await store.revertToVersion('123', 1)

      expect(result).toEqual(revertedEvent)
      expect(store.events[0]).toEqual(revertedEvent)
      expect(eventsAPI.revert).toHaveBeenCalledWith('123', 1)
    })

    it('handles revert when event not in local array', async () => {
      const store = useEventsStore()
      store.events = [{ _id: '456', name: 'Other Event' }]

      const revertedEvent = { _id: '123', name: 'Version 1' }
      eventsAPI.revert = vi.fn().mockResolvedValue({ data: revertedEvent })

      const result = await store.revertToVersion('123', 1)

      expect(result).toEqual(revertedEvent)
      expect(store.events).toHaveLength(1)
    })

    it('throws error on revert failure', async () => {
      const store = useEventsStore()
      eventsAPI.revert = vi.fn().mockRejectedValue({
        response: { data: { error: 'Revert failed' } },
      })

      await expect(store.revertToVersion('123', 1)).rejects.toThrow()
      expect(store.error).toBe('Revert failed')
    })
  })

  describe('fetchChildren', () => {
    it('fetches child events successfully', async () => {
      const store = useEventsStore()
      const mockChildren = [
        { _id: '1', parentEventId: '123' },
        { _id: '2', parentEventId: '123' },
      ]

      eventsAPI.getChildren = vi.fn().mockResolvedValue({ data: mockChildren })

      const result = await store.fetchChildren('123')

      expect(result).toEqual(mockChildren)
      expect(eventsAPI.getChildren).toHaveBeenCalledWith('123')
    })

    it('returns empty array on fetch failure', async () => {
      const store = useEventsStore()
      eventsAPI.getChildren = vi.fn().mockRejectedValue({
        response: { data: { error: 'Not found' } },
      })

      const result = await store.fetchChildren('123')

      expect(result).toEqual([])
      expect(store.error).toBe('Not found')
    })
  })
})
