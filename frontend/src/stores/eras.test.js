import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useErasStore } from './eras'
import { erasAPI } from '../services/api'

vi.mock('../services/api')

describe('useErasStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('sortedEras computed', () => {
    it('sorts eras by startDate year', () => {
      const store = useErasStore()
      store.eras = [
        { _id: '1', name: 'Modern Era', startDate: { year: 1700 } },
        { _id: '2', name: 'Ancient Era', startDate: { year: 500 } },
        { _id: '3', name: 'Golden Era', startDate: { year: 1500 } },
      ]

      expect(store.sortedEras).toEqual([
        { _id: '2', name: 'Ancient Era', startDate: { year: 500 } },
        { _id: '3', name: 'Golden Era', startDate: { year: 1500 } },
        { _id: '1', name: 'Modern Era', startDate: { year: 1700 } },
      ])
    })

    it('sorts by month when years are equal', () => {
      const store = useErasStore()
      store.eras = [
        { _id: '1', name: 'Era B', startDate: { year: 1500, month: 6 } },
        { _id: '2', name: 'Era A', startDate: { year: 1500, month: 1 } },
      ]

      expect(store.sortedEras[0].startDate.month).toBe(1)
      expect(store.sortedEras[1].startDate.month).toBe(6)
    })

    it('sorts by day when years and months are equal', () => {
      const store = useErasStore()
      store.eras = [
        { _id: '1', name: 'Era B', startDate: { year: 1500, month: 1, day: 15 } },
        { _id: '2', name: 'Era A', startDate: { year: 1500, month: 1, day: 1 } },
      ]

      expect(store.sortedEras[0].startDate.day).toBe(1)
      expect(store.sortedEras[1].startDate.day).toBe(15)
    })

    it('handles null months and days correctly', () => {
      const store = useErasStore()
      store.eras = [
        { _id: '1', name: 'Era B', startDate: { year: 1500, month: 3 } },
        { _id: '2', name: 'Era A', startDate: { year: 1500 } },
      ]

      expect(store.sortedEras[0].name).toBe('Era A')
      expect(store.sortedEras[1].name).toBe('Era B')
    })
  })

  describe('initial state', () => {
    it('initializes with empty eras array', () => {
      const store = useErasStore()
      expect(store.eras).toEqual([])
    })

    it('initializes with null currentEra', () => {
      const store = useErasStore()
      expect(store.currentEra).toBeNull()
    })

    it('initializes with loading false', () => {
      const store = useErasStore()
      expect(store.loading).toBe(false)
    })

    it('initializes with null error', () => {
      const store = useErasStore()
      expect(store.error).toBeNull()
    })
  })

  describe('fetchAll', () => {
    it('fetches all eras successfully', async () => {
      const store = useErasStore()
      const mockEras = [
        { _id: '1', name: 'Age of Pirates', startDate: { year: 1500 } },
        { _id: '2', name: 'Ancient Age', startDate: { year: 1000 } },
      ]

      erasAPI.getAll = vi.fn().mockResolvedValue({ data: mockEras })

      await store.fetchAll()

      expect(store.eras).toEqual(mockEras)
      expect(store.error).toBeNull()
    })

    it('sets loading to true during fetch', async () => {
      const store = useErasStore()
      erasAPI.getAll = vi.fn().mockResolvedValue({ data: [] })

      const promise = store.fetchAll()
      expect(store.loading).toBe(true)
      await promise
    })

    it('sets error on fetch failure', async () => {
      const store = useErasStore()
      erasAPI.getAll = vi.fn().mockRejectedValue({
        response: { data: { error: 'Network error' } },
      })

      await store.fetchAll()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchById', () => {
    it('fetches era by id successfully', async () => {
      const store = useErasStore()
      const mockEra = {
        _id: '123',
        name: 'Great Pirate Era',
        startDate: { year: 1500 },
        endDate: { year: 1550 },
      }

      erasAPI.getById = vi.fn().mockResolvedValue({ data: mockEra })

      await store.fetchById('123')

      expect(store.currentEra).toEqual(mockEra)
      expect(erasAPI.getById).toHaveBeenCalledWith('123')
    })

    it('sets error on fetch failure', async () => {
      const store = useErasStore()
      erasAPI.getById = vi.fn().mockRejectedValue({
        response: { data: { error: 'Not found' } },
      })

      await store.fetchById('123')

      expect(store.error).toBe('Not found')
    })
  })

  describe('CRUD operations', () => {
    it('creates era successfully', async () => {
      const store = useErasStore()
      const newEra = {
        name: 'New Era',
        startDate: { year: 1600 },
        endDate: { year: 1650 },
      }
      const createdEra = { _id: '123', ...newEra }

      erasAPI.create = vi.fn().mockResolvedValue({ data: createdEra })

      const result = await store.create(newEra)

      expect(result).toEqual(createdEra)
      expect(store.eras).toContainEqual(createdEra)
    })

    it('throws error on create failure', async () => {
      const store = useErasStore()
      const newEra = { name: 'New Era' }

      erasAPI.create = vi.fn().mockRejectedValue({
        response: { data: { error: 'Validation failed' } },
      })

      await expect(store.create(newEra)).rejects.toThrow()
      expect(store.error).toBe('Validation failed')
    })

    it('updates era successfully', async () => {
      const store = useErasStore()
      store.eras = [
        {
          _id: '123',
          name: 'Old Name',
          startDate: { year: 1500 },
          endDate: { year: 1550 },
        },
      ]

      const updatedEra = {
        _id: '123',
        name: 'New Name',
        startDate: { year: 1500 },
        endDate: { year: 1550 },
      }
      erasAPI.update = vi.fn().mockResolvedValue({ data: updatedEra })

      await store.update('123', updatedEra)

      expect(store.eras[0]).toEqual(updatedEra)
    })

    it('throws error on update failure', async () => {
      const store = useErasStore()
      erasAPI.update = vi.fn().mockRejectedValue({
        response: { data: { error: 'Update failed' } },
      })

      await expect(store.update('123', {})).rejects.toThrow()
      expect(store.error).toBe('Update failed')
    })

    it('deletes era successfully', async () => {
      const store = useErasStore()
      store.eras = [
        { _id: '123', name: 'Era to delete', startDate: { year: 1500 } },
        { _id: '456', name: 'Other Era', startDate: { year: 1600 } },
      ]

      erasAPI.delete = vi.fn().mockResolvedValue({})

      await store.deleteEra('123')

      expect(store.eras).toHaveLength(1)
      expect(store.eras[0]._id).toBe('456')
    })

    it('throws error on delete failure', async () => {
      const store = useErasStore()
      erasAPI.delete = vi.fn().mockRejectedValue({
        response: { data: { error: 'Delete failed' } },
      })

      await expect(store.deleteEra('123')).rejects.toThrow()
      expect(store.error).toBe('Delete failed')
    })
  })
})
