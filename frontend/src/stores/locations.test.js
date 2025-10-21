import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLocationsStore } from './locations'
import { locationsAPI } from '../services/api'

vi.mock('../services/api')

describe('useLocationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('sortedLocations computed', () => {
    it('sorts locations by type then name', () => {
      const store = useLocationsStore()
      store.locations = [
        { _id: '1', name: 'Water 7', type: 'CityTownVillage' },
        { _id: '2', name: 'Alabasta', type: 'Kingdom' },
        { _id: '3', name: 'East Blue', type: 'Sea' },
        { _id: '4', name: 'Wano', type: 'Kingdom' },
      ]

      const sorted = store.sortedLocations
      expect(sorted[0].type).toBe('Sea')
      expect(sorted[1].type).toBe('Kingdom')
      expect(sorted[1].name).toBe('Alabasta') // Alphabetically before Wano
      expect(sorted[2].type).toBe('Kingdom')
      expect(sorted[2].name).toBe('Wano')
      expect(sorted[3].type).toBe('CityTownVillage')
    })
  })

  describe('fetchHierarchy', () => {
    it('fetches location hierarchy', async () => {
      const store = useLocationsStore()
      const mockHierarchy = [
        { _id: '1', name: 'Grand Line', type: 'Sea' },
        { _id: '2', name: 'Alabasta', type: 'Kingdom' },
      ]

      locationsAPI.getHierarchy = vi.fn().mockResolvedValue({ data: mockHierarchy })

      const result = await store.fetchHierarchy('123')

      expect(result).toEqual(mockHierarchy)
      expect(locationsAPI.getHierarchy).toHaveBeenCalledWith('123')
    })

    it('returns empty array on failure', async () => {
      const store = useLocationsStore()
      locationsAPI.getHierarchy = vi.fn().mockRejectedValue({})

      const result = await store.fetchHierarchy('123')

      expect(result).toEqual([])
    })
  })

  describe('fetchChildren', () => {
    it('fetches child locations', async () => {
      const store = useLocationsStore()
      const mockChildren = [
        { _id: '1', name: 'Alubarna', type: 'CityTownVillage', parentLocationId: '123' },
      ]

      locationsAPI.getChildren = vi.fn().mockResolvedValue({ data: mockChildren })

      const result = await store.fetchChildren('123')

      expect(result).toEqual(mockChildren)
    })
  })

  describe('fetchEvents', () => {
    it('fetches events for location', async () => {
      const store = useLocationsStore()
      const mockEvents = [
        { _id: '1', name: 'Event 1', locationId: '123' },
      ]

      locationsAPI.getEvents = vi.fn().mockResolvedValue({ data: mockEvents })

      const result = await store.fetchEvents('123')

      expect(result).toEqual(mockEvents)
    })
  })

  describe('CRUD operations', () => {
    it('creates location', async () => {
      const store = useLocationsStore()
      const newLocation = { name: 'Elbaf', type: 'Island' }
      const created = { _id: '123', ...newLocation }

      locationsAPI.create = vi.fn().mockResolvedValue({ data: created })

      await store.create(newLocation)

      expect(store.locations).toContainEqual(created)
    })

    it('updates location', async () => {
      const store = useLocationsStore()
      store.locations = [{ _id: '123', name: 'Old' }]

      const updated = { _id: '123', name: 'New' }
      locationsAPI.update = vi.fn().mockResolvedValue({ data: updated })

      await store.update('123', updated)

      expect(store.locations[0].name).toBe('New')
    })

    it('deletes location', async () => {
      const store = useLocationsStore()
      store.locations = [
        { _id: '123', name: 'Location 1' },
        { _id: '456', name: 'Location 2' },
      ]

      locationsAPI.delete = vi.fn().mockResolvedValue({})

      await store.deleteLocation('123')

      expect(store.locations).toHaveLength(1)
    })
  })
})
