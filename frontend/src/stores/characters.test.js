import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharactersStore } from './characters'
import { charactersAPI } from '../services/api'

vi.mock('../services/api')

describe('useCharactersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty characters array', () => {
      const store = useCharactersStore()
      expect(store.characters).toEqual([])
    })

    it('initializes with null currentCharacter', () => {
      const store = useCharactersStore()
      expect(store.currentCharacter).toBeNull()
    })

    it('initializes with loading false', () => {
      const store = useCharactersStore()
      expect(store.loading).toBe(false)
    })

    it('initializes with null error', () => {
      const store = useCharactersStore()
      expect(store.error).toBeNull()
    })
  })

  describe('sortedCharacters computed', () => {
    it('sorts characters alphabetically by name', () => {
      const store = useCharactersStore()
      store.characters = [
        { _id: '1', name: 'Zoro' },
        { _id: '2', name: 'Luffy' },
        { _id: '3', name: 'Nami' },
      ]

      expect(store.sortedCharacters).toEqual([
        { _id: '2', name: 'Luffy' },
        { _id: '3', name: 'Nami' },
        { _id: '1', name: 'Zoro' },
      ])
    })

    it('handles case-insensitive sorting', () => {
      const store = useCharactersStore()
      store.characters = [
        { _id: '1', name: 'zoro' },
        { _id: '2', name: 'Luffy' },
        { _id: '3', name: 'NAMI' },
      ]

      const sorted = store.sortedCharacters
      expect(sorted[0].name).toBe('Luffy')
      expect(sorted[1].name).toBe('NAMI')
      expect(sorted[2].name).toBe('zoro')
    })

    it('does not mutate original characters array', () => {
      const store = useCharactersStore()
      store.characters = [
        { _id: '1', name: 'Zoro' },
        { _id: '2', name: 'Luffy' },
      ]

      const originalOrder = store.characters[0].name
      store.sortedCharacters // Access computed property

      expect(store.characters[0].name).toBe(originalOrder)
    })
  })

  describe('fetchAll', () => {
    it('fetches all characters successfully', async () => {
      const store = useCharactersStore()
      const mockCharacters = [
        { _id: '1', name: 'Luffy' },
        { _id: '2', name: 'Zoro' },
      ]

      charactersAPI.getAll = vi.fn().mockResolvedValue({ data: mockCharacters })

      await store.fetchAll()

      expect(store.characters).toEqual(mockCharacters)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets loading to true during fetch', async () => {
      const store = useCharactersStore()
      charactersAPI.getAll = vi.fn().mockResolvedValue({ data: [] })

      const promise = store.fetchAll()
      expect(store.loading).toBe(true)
      await promise
    })

    it('sets error on fetch failure', async () => {
      const store = useCharactersStore()
      charactersAPI.getAll = vi.fn().mockRejectedValue({
        response: { data: { error: 'Network error' } },
      })

      await store.fetchAll()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchById', () => {
    it('fetches character by id successfully', async () => {
      const store = useCharactersStore()
      const mockCharacter = { _id: '123', name: 'Luffy' }

      charactersAPI.getById = vi.fn().mockResolvedValue({ data: mockCharacter })

      await store.fetchById('123')

      expect(store.currentCharacter).toEqual(mockCharacter)
      expect(charactersAPI.getById).toHaveBeenCalledWith('123')
    })

    it('sets error on fetch failure', async () => {
      const store = useCharactersStore()
      charactersAPI.getById = vi.fn().mockRejectedValue({
        response: { data: { error: 'Not found' } },
      })

      await store.fetchById('123')

      expect(store.error).toBe('Not found')
    })
  })

  describe('search', () => {
    it('searches characters successfully', async () => {
      const store = useCharactersStore()
      const mockResults = [
        { _id: '1', name: 'Monkey D. Luffy' },
        { _id: '2', name: 'Monkey D. Dragon' },
      ]

      charactersAPI.search = vi.fn().mockResolvedValue({ data: mockResults })

      const results = await store.search('Monkey')

      expect(results).toEqual(mockResults)
      expect(charactersAPI.search).toHaveBeenCalledWith('Monkey')
    })

    it('returns empty array on search failure', async () => {
      const store = useCharactersStore()
      charactersAPI.search = vi.fn().mockRejectedValue({
        response: { data: { error: 'Search failed' } },
      })

      const results = await store.search('test')

      expect(results).toEqual([])
      expect(store.error).toBe('Search failed')
    })
  })

  describe('fetchAliveAtDate', () => {
    it('fetches characters alive at date successfully', async () => {
      const store = useCharactersStore()
      const mockCharacters = [
        { _id: '1', name: 'Luffy', isAlive: true },
        { _id: '2', name: 'Ace', isAlive: false },
      ]

      charactersAPI.getAliveAtDate = vi.fn().mockResolvedValue({ data: mockCharacters })

      const results = await store.fetchAliveAtDate(1520)

      expect(results).toEqual(mockCharacters)
      expect(charactersAPI.getAliveAtDate).toHaveBeenCalledWith(1520)
    })

    it('returns empty array on fetch failure', async () => {
      const store = useCharactersStore()
      charactersAPI.getAliveAtDate = vi.fn().mockRejectedValue({
        response: { data: { error: 'Failed to fetch' } },
      })

      const results = await store.fetchAliveAtDate(1520)

      expect(results).toEqual([])
      expect(store.error).toBe('Failed to fetch')
    })
  })

  describe('create', () => {
    it('creates character successfully', async () => {
      const store = useCharactersStore()
      const newCharacter = { name: 'Sanji', affiliation: 'Straw Hat Pirates' }
      const createdCharacter = { _id: '123', ...newCharacter }

      charactersAPI.create = vi.fn().mockResolvedValue({ data: createdCharacter })

      const result = await store.create(newCharacter)

      expect(result).toEqual(createdCharacter)
      expect(store.characters).toContainEqual(createdCharacter)
      expect(charactersAPI.create).toHaveBeenCalledWith(newCharacter)
    })

    it('throws error on create failure', async () => {
      const store = useCharactersStore()
      const newCharacter = { name: 'Test' }

      charactersAPI.create = vi.fn().mockRejectedValue({
        response: { data: { error: 'Validation failed' } },
      })

      await expect(store.create(newCharacter)).rejects.toThrow()
      expect(store.error).toBe('Validation failed')
    })
  })

  describe('update', () => {
    it('updates character successfully', async () => {
      const store = useCharactersStore()
      store.characters = [
        { _id: '123', name: 'Old Name' },
        { _id: '456', name: 'Other Character' },
      ]

      const updatedCharacter = { _id: '123', name: 'New Name' }
      charactersAPI.update = vi.fn().mockResolvedValue({ data: updatedCharacter })

      const result = await store.update('123', updatedCharacter)

      expect(result).toEqual(updatedCharacter)
      expect(store.characters[0]).toEqual(updatedCharacter)
      expect(charactersAPI.update).toHaveBeenCalledWith('123', updatedCharacter)
    })

    it('handles update when character not in local array', async () => {
      const store = useCharactersStore()
      store.characters = [{ _id: '456', name: 'Other Character' }]

      const updatedCharacter = { _id: '123', name: 'New Name' }
      charactersAPI.update = vi.fn().mockResolvedValue({ data: updatedCharacter })

      const result = await store.update('123', updatedCharacter)

      expect(result).toEqual(updatedCharacter)
      expect(store.characters).toHaveLength(1)
    })

    it('throws error on update failure', async () => {
      const store = useCharactersStore()
      charactersAPI.update = vi.fn().mockRejectedValue({
        response: { data: { error: 'Update failed' } },
      })

      await expect(store.update('123', {})).rejects.toThrow()
      expect(store.error).toBe('Update failed')
    })
  })

  describe('deleteCharacter', () => {
    it('deletes character successfully', async () => {
      const store = useCharactersStore()
      store.characters = [
        { _id: '123', name: 'Character to delete' },
        { _id: '456', name: 'Other Character' },
      ]

      charactersAPI.delete = vi.fn().mockResolvedValue({})

      await store.deleteCharacter('123')

      expect(store.characters).toHaveLength(1)
      expect(store.characters[0]._id).toBe('456')
      expect(charactersAPI.delete).toHaveBeenCalledWith('123')
    })

    it('throws error on delete failure', async () => {
      const store = useCharactersStore()
      charactersAPI.delete = vi.fn().mockRejectedValue({
        response: { data: { error: 'Delete failed' } },
      })

      await expect(store.deleteCharacter('123')).rejects.toThrow()
      expect(store.error).toBe('Delete failed')
    })
  })
})
