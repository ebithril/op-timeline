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

  describe('CRUD operations', () => {
    it('fetches all sagas', async () => {
      const store = useSagasStore()
      const mockSagas = [
        { _id: '1', name: 'East Blue', order: 1 },
        { _id: '2', name: 'Alabasta', order: 2 },
      ]

      sagasAPI.getAll = vi.fn().mockResolvedValue({ data: mockSagas })

      await store.fetchAll()

      expect(store.sagas).toEqual(mockSagas)
    })

    it('creates saga', async () => {
      const store = useSagasStore()
      const newSaga = { name: 'New Saga', order: 10 }
      const createdSaga = { _id: '123', ...newSaga }

      sagasAPI.create = vi.fn().mockResolvedValue({ data: createdSaga })

      await store.create(newSaga)

      expect(store.sagas).toContainEqual(createdSaga)
    })

    it('updates saga', async () => {
      const store = useSagasStore()
      store.sagas = [{ _id: '123', name: 'Old', order: 1 }]

      const updated = { _id: '123', name: 'New', order: 1 }
      sagasAPI.update = vi.fn().mockResolvedValue({ data: updated })

      await store.update('123', updated)

      expect(store.sagas[0].name).toBe('New')
    })

    it('deletes saga', async () => {
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
  })
})
