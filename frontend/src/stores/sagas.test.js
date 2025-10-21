import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSagasStore } from './sagas'
import { sagasAPI } from '../services/api'

vi.mock('../services/api')

describe('useSagasStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty sagas array', () => {
      const store = useSagasStore()
      expect(store.sagas).toEqual([])
    })

    it('initializes with null currentSaga', () => {
      const store = useSagasStore()
      expect(store.currentSaga).toBeNull()
    })

    it('initializes with loading false', () => {
      const store = useSagasStore()
      expect(store.loading).toBe(false)
    })

    it('initializes with null error', () => {
      const store = useSagasStore()
      expect(store.error).toBeNull()
    })
  })

  describe('sortedSagas computed', () => {
    it('sorts sagas by order', () => {
      const store = useSagasStore()
      store.sagas = [
        { _id: '1', name: 'Summit War', order: 3 },
        { _id: '2', name: 'East Blue', order: 1 },
        { _id: '3', name: 'Alabasta', order: 2 },
      ]

      expect(store.sortedSagas).toEqual([
        { _id: '2', name: 'East Blue', order: 1 },
        { _id: '3', name: 'Alabasta', order: 2 },
        { _id: '1', name: 'Summit War', order: 3 },
      ])
    })
  })

  describe('fetchAll', () => {
    it('fetches all sagas successfully', async () => {
      const store = useSagasStore()
      const mockSagas = [
        { _id: '1', name: 'East Blue', order: 1 },
        { _id: '2', name: 'Alabasta', order: 2 },
      ]

      sagasAPI.getAll = vi.fn().mockResolvedValue({ data: mockSagas })

      await store.fetchAll()

      expect(store.sagas).toEqual(mockSagas)
      expect(store.error).toBeNull()
    })

    it('sets loading to true during fetch', async () => {
      const store = useSagasStore()
      sagasAPI.getAll = vi.fn().mockResolvedValue({ data: [] })

      const promise = store.fetchAll()
      expect(store.loading).toBe(true)
      await promise
    })

    it('sets error on fetch failure', async () => {
      const store = useSagasStore()
      sagasAPI.getAll = vi.fn().mockRejectedValue({
        response: { data: { error: 'Network error' } },
      })

      await store.fetchAll()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchById', () => {
    it('fetches saga by id successfully', async () => {
      const store = useSagasStore()
      const mockSaga = { _id: '123', name: 'Summit War', order: 3 }

      sagasAPI.getById = vi.fn().mockResolvedValue({ data: mockSaga })

      await store.fetchById('123')

      expect(store.currentSaga).toEqual(mockSaga)
      expect(sagasAPI.getById).toHaveBeenCalledWith('123')
    })

    it('sets error on fetch failure', async () => {
      const store = useSagasStore()
      sagasAPI.getById = vi.fn().mockRejectedValue({
        response: { data: { error: 'Not found' } },
      })

      await store.fetchById('123')

      expect(store.error).toBe('Not found')
    })
  })

  describe('create', () => {
    it('creates saga successfully', async () => {
      const store = useSagasStore()
      const newSaga = { name: 'New Saga', order: 10 }
      const createdSaga = { _id: '123', ...newSaga }

      sagasAPI.create = vi.fn().mockResolvedValue({ data: createdSaga })

      const result = await store.create(newSaga)

      expect(result).toEqual(createdSaga)
      expect(store.sagas).toContainEqual(createdSaga)
    })

    it('throws error on create failure', async () => {
      const store = useSagasStore()
      const newSaga = { name: 'New Saga' }

      sagasAPI.create = vi.fn().mockRejectedValue({
        response: { data: { error: 'Validation failed' } },
      })

      await expect(store.create(newSaga)).rejects.toThrow()
      expect(store.error).toBe('Validation failed')
    })
  })

  describe('update', () => {
    it('updates saga successfully', async () => {
      const store = useSagasStore()
      store.sagas = [{ _id: '123', name: 'Old', order: 1 }]

      const updated = { _id: '123', name: 'New', order: 1 }
      sagasAPI.update = vi.fn().mockResolvedValue({ data: updated })

      const result = await store.update('123', updated)

      expect(result).toEqual(updated)
      expect(store.sagas[0].name).toBe('New')
    })

    it('throws error on update failure', async () => {
      const store = useSagasStore()
      sagasAPI.update = vi.fn().mockRejectedValue({
        response: { data: { error: 'Update failed' } },
      })

      await expect(store.update('123', {})).rejects.toThrow()
      expect(store.error).toBe('Update failed')
    })
  })

  describe('deleteSaga', () => {
    it('deletes saga successfully', async () => {
      const store = useSagasStore()
      store.sagas = [
        { _id: '123', name: 'Saga 1' },
        { _id: '456', name: 'Saga 2' },
      ]

      sagasAPI.delete = vi.fn().mockResolvedValue({})

      await store.deleteSaga('123')

      expect(store.sagas).toHaveLength(1)
      expect(store.sagas[0]._id).toBe('456')
    })

    it('throws error on delete failure', async () => {
      const store = useSagasStore()
      sagasAPI.delete = vi.fn().mockRejectedValue({
        response: { data: { error: 'Delete failed' } },
      })

      await expect(store.deleteSaga('123')).rejects.toThrow()
      expect(store.error).toBe('Delete failed')
    })
  })
})
