import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useArcsStore } from './arcs'
import { arcsAPI } from '../services/api'

vi.mock('../services/api')

describe('useArcsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('sortedArcs computed', () => {
    it('sorts arcs by startChapter', () => {
      const store = useArcsStore()
      store.arcs = [
        { _id: '1', name: 'Dressrosa', startChapter: 700 },
        { _id: '2', name: 'Romance Dawn', startChapter: 1 },
        { _id: '3', name: 'Wano', startChapter: 909 },
      ]

      expect(store.sortedArcs).toEqual([
        { _id: '2', name: 'Romance Dawn', startChapter: 1 },
        { _id: '1', name: 'Dressrosa', startChapter: 700 },
        { _id: '3', name: 'Wano', startChapter: 909 },
      ])
    })

    it('sorts by name when startChapter is null', () => {
      const store = useArcsStore()
      store.arcs = [
        { _id: '1', name: 'Zephyr Arc', startChapter: null },
        { _id: '2', name: 'Alpha Arc', startChapter: null },
      ]

      expect(store.sortedArcs[0].name).toBe('Alpha Arc')
      expect(store.sortedArcs[1].name).toBe('Zephyr Arc')
    })

    it('puts arcs with chapters before arcs without', () => {
      const store = useArcsStore()
      store.arcs = [
        { _id: '1', name: 'Unknown Arc', startChapter: null },
        { _id: '2', name: 'Romance Dawn', startChapter: 1 },
      ]

      expect(store.sortedArcs[0].startChapter).toBe(1)
      expect(store.sortedArcs[1].startChapter).toBeNull()
    })
  })

  describe('initial state', () => {
    it('initializes with empty arcs array', () => {
      const store = useArcsStore()
      expect(store.arcs).toEqual([])
    })

    it('initializes with null currentArc', () => {
      const store = useArcsStore()
      expect(store.currentArc).toBeNull()
    })

    it('initializes with loading false', () => {
      const store = useArcsStore()
      expect(store.loading).toBe(false)
    })

    it('initializes with null error', () => {
      const store = useArcsStore()
      expect(store.error).toBeNull()
    })
  })

  describe('fetchAll', () => {
    it('fetches all arcs successfully', async () => {
      const store = useArcsStore()
      const mockArcs = [
        { _id: '1', name: 'Romance Dawn' },
        { _id: '2', name: 'Alabasta' },
      ]

      arcsAPI.getAll = vi.fn().mockResolvedValue({ data: mockArcs })

      await store.fetchAll()

      expect(store.arcs).toEqual(mockArcs)
      expect(store.error).toBeNull()
    })

    it('sets loading to true during fetch', async () => {
      const store = useArcsStore()
      arcsAPI.getAll = vi.fn().mockResolvedValue({ data: [] })

      const promise = store.fetchAll()
      expect(store.loading).toBe(true)
      await promise
    })

    it('sets error on fetch failure', async () => {
      const store = useArcsStore()
      arcsAPI.getAll = vi.fn().mockRejectedValue({
        response: { data: { error: 'Network error' } },
      })

      await store.fetchAll()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchById', () => {
    it('fetches arc by id successfully', async () => {
      const store = useArcsStore()
      const mockArc = { _id: '123', name: 'Dressrosa' }

      arcsAPI.getById = vi.fn().mockResolvedValue({ data: mockArc })

      await store.fetchById('123')

      expect(store.currentArc).toEqual(mockArc)
      expect(arcsAPI.getById).toHaveBeenCalledWith('123')
    })

    it('sets error on fetch failure', async () => {
      const store = useArcsStore()
      arcsAPI.getById = vi.fn().mockRejectedValue({
        response: { data: { error: 'Not found' } },
      })

      await store.fetchById('123')

      expect(store.error).toBe('Not found')
    })
  })

  describe('fetchBySagaId', () => {
    it('fetches arcs by saga id', async () => {
      const store = useArcsStore()
      const mockArcs = [
        { _id: '1', name: 'Arc 1', sagaId: 'saga123' },
        { _id: '2', name: 'Arc 2', sagaId: 'saga123' },
      ]

      arcsAPI.getBySagaId = vi.fn().mockResolvedValue({ data: mockArcs })

      await store.fetchBySagaId('saga123')

      expect(store.arcs).toEqual(mockArcs)
      expect(arcsAPI.getBySagaId).toHaveBeenCalledWith('saga123')
    })

    it('sets error on fetch failure', async () => {
      const store = useArcsStore()
      arcsAPI.getBySagaId = vi.fn().mockRejectedValue({
        response: { data: { error: 'Saga not found' } },
      })

      await store.fetchBySagaId('invalid')

      expect(store.error).toBe('Saga not found')
    })
  })

  describe('CRUD operations', () => {
    it('creates arc successfully', async () => {
      const store = useArcsStore()
      const newArc = { name: 'New Arc', startChapter: 1000 }
      const createdArc = { _id: '123', ...newArc }

      arcsAPI.create = vi.fn().mockResolvedValue({ data: createdArc })

      const result = await store.create(newArc)

      expect(result).toEqual(createdArc)
      expect(store.arcs).toContainEqual(createdArc)
    })

    it('throws error on create failure', async () => {
      const store = useArcsStore()
      const newArc = { name: 'New Arc' }

      arcsAPI.create = vi.fn().mockRejectedValue({
        response: { data: { error: 'Validation failed' } },
      })

      await expect(store.create(newArc)).rejects.toThrow()
      expect(store.error).toBe('Validation failed')
    })

    it('updates arc successfully', async () => {
      const store = useArcsStore()
      store.arcs = [{ _id: '123', name: 'Old Name' }]

      const updatedArc = { _id: '123', name: 'New Name' }
      arcsAPI.update = vi.fn().mockResolvedValue({ data: updatedArc })

      await store.update('123', updatedArc)

      expect(store.arcs[0]).toEqual(updatedArc)
    })

    it('throws error on update failure', async () => {
      const store = useArcsStore()
      arcsAPI.update = vi.fn().mockRejectedValue({
        response: { data: { error: 'Update failed' } },
      })

      await expect(store.update('123', {})).rejects.toThrow()
      expect(store.error).toBe('Update failed')
    })

    it('deletes arc successfully', async () => {
      const store = useArcsStore()
      store.arcs = [
        { _id: '123', name: 'Arc to delete' },
        { _id: '456', name: 'Other Arc' },
      ]

      arcsAPI.delete = vi.fn().mockResolvedValue({})

      await store.deleteArc('123')

      expect(store.arcs).toHaveLength(1)
      expect(store.arcs[0]._id).toBe('456')
    })

    it('throws error on delete failure', async () => {
      const store = useArcsStore()
      arcsAPI.delete = vi.fn().mockRejectedValue({
        response: { data: { error: 'Delete failed' } },
      })

      await expect(store.deleteArc('123')).rejects.toThrow()
      expect(store.error).toBe('Delete failed')
    })
  })
})
