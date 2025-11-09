import { describe, it, expect, beforeEach } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import router from './index'
import TimelineView from '../views/TimelineView.vue'
import EventDetailView from '../views/EventDetailView.vue'
import EventEditView from '../views/EventEditView.vue'
import CharactersView from '../views/CharactersView.vue'
import CharacterEditView from '../views/CharacterEditView.vue'
import LocationsView from '../views/LocationsView.vue'
import LocationEditView from '../views/LocationEditView.vue'
import LocationDetailView from '../views/LocationDetailView.vue'
import SagasView from '../views/SagasView.vue'
import SagaEditView from '../views/SagaEditView.vue'
import ArcsView from '../views/ArcsView.vue'
import ArcEditView from '../views/ArcEditView.vue'
import ErasView from '../views/ErasView.vue'
import EraEditView from '../views/EraEditView.vue'

// Import the route configuration
const routes = [
  {
    path: '/',
    name: 'timeline',
    component: TimelineView,
  },
  {
    path: '/event/:id',
    name: 'event-detail',
    component: EventDetailView,
  },
  {
    path: '/event/:id/edit',
    name: 'event-edit',
    component: EventEditView,
  },
  {
    path: '/event/new',
    name: 'event-new',
    component: EventEditView,
  },
  {
    path: '/characters',
    name: 'characters',
    component: CharactersView,
  },
  {
    path: '/characters/:id',
    name: 'character-detail',
    component: CharactersView,
  },
  {
    path: '/characters/:id/edit',
    name: 'character-edit',
    component: CharacterEditView,
  },
  {
    path: '/characters/new',
    name: 'character-new',
    component: CharacterEditView,
  },
  {
    path: '/locations',
    name: 'locations',
    component: LocationsView,
  },
  {
    path: '/locations/:id',
    name: 'location-detail',
    component: LocationDetailView,
  },
  {
    path: '/locations/:id/edit',
    name: 'location-edit',
    component: LocationEditView,
  },
  {
    path: '/locations/new',
    name: 'location-new',
    component: LocationEditView,
  },
  {
    path: '/sagas',
    name: 'sagas',
    component: SagasView,
  },
  {
    path: '/sagas/:id',
    name: 'saga-edit',
    component: SagaEditView,
  },
  {
    path: '/sagas/new',
    name: 'saga-new',
    component: SagaEditView,
  },
  {
    path: '/arcs',
    name: 'arcs',
    component: ArcsView,
  },
  {
    path: '/arcs/:id',
    name: 'arc-edit',
    component: ArcEditView,
  },
  {
    path: '/arcs/new',
    name: 'arc-new',
    component: ArcEditView,
  },
  {
    path: '/eras',
    name: 'eras',
    component: ErasView,
  },
  {
    path: '/eras/:id',
    name: 'era-edit',
    component: EraEditView,
  },
  {
    path: '/eras/new',
    name: 'era-new',
    component: EraEditView,
  },
]

describe('Router', () => {
  let testRouter

  beforeEach(() => {
    testRouter = createRouter({
      history: createMemoryHistory(),
      routes,
    })
  })

  describe('exported router instance', () => {
    it('exports a valid router instance', () => {
      expect(router).toBeDefined()
      expect(testRouter.getRoutes).toBeDefined()
    })

    it('has all expected routes defined', () => {
      const routeNames = router.getRoutes().map((r) => r.name)
      expect(routeNames).toContain('timeline')
      expect(routeNames).toContain('event-detail')
      expect(routeNames).toContain('characters')
    })
  })

  describe('route definitions', () => {
    it('defines the correct number of routes', () => {
      expect(testRouter.getRoutes()).toHaveLength(21)
    })

    it('has all route names defined', () => {
      const routeNames = testRouter.getRoutes().map((r) => r.name)
      expect(routeNames).toContain('timeline')
      expect(routeNames).toContain('event-detail')
      expect(routeNames).toContain('event-edit')
      expect(routeNames).toContain('event-new')
      expect(routeNames).toContain('characters')
      expect(routeNames).toContain('character-detail')
      expect(routeNames).toContain('character-edit')
      expect(routeNames).toContain('character-new')
      expect(routeNames).toContain('locations')
      expect(routeNames).toContain('location-detail')
      expect(routeNames).toContain('location-edit')
      expect(routeNames).toContain('location-new')
      expect(routeNames).toContain('sagas')
      expect(routeNames).toContain('saga-edit')
      expect(routeNames).toContain('saga-new')
      expect(routeNames).toContain('arcs')
      expect(routeNames).toContain('arc-edit')
      expect(routeNames).toContain('arc-new')
      expect(routeNames).toContain('eras')
      expect(routeNames).toContain('era-edit')
      expect(routeNames).toContain('era-new')
    })
  })

  describe('timeline routes', () => {
    it('matches root path to timeline view', async () => {
      await testRouter.push('/')
      expect(testRouter.currentRoute.value.name).toBe('timeline')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(TimelineView)
    })
  })

  describe('event routes', () => {
    it('matches /event/:id to event-detail', async () => {
      await testRouter.push('/event/123')
      expect(testRouter.currentRoute.value.name).toBe('event-detail')
      expect(testRouter.currentRoute.value.params.id).toBe('123')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(EventDetailView)
    })

    it('matches /event/:id/edit to event-edit', async () => {
      await testRouter.push('/event/456/edit')
      expect(testRouter.currentRoute.value.name).toBe('event-edit')
      expect(testRouter.currentRoute.value.params.id).toBe('456')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(EventEditView)
    })

    it('matches /event/new to event-new', async () => {
      await testRouter.push('/event/new')
      expect(testRouter.currentRoute.value.name).toBe('event-new')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(EventEditView)
    })
  })

  describe('character routes', () => {
    it('matches /characters to characters view', async () => {
      await testRouter.push('/characters')
      expect(testRouter.currentRoute.value.name).toBe('characters')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(CharactersView)
    })

    it('matches /characters/:id to character-detail', async () => {
      await testRouter.push('/characters/luffy-123')
      expect(testRouter.currentRoute.value.name).toBe('character-detail')
      expect(testRouter.currentRoute.value.params.id).toBe('luffy-123')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(CharactersView)
    })

    it('matches /characters/:id/edit to character-edit', async () => {
      await testRouter.push('/characters/luffy-123/edit')
      expect(testRouter.currentRoute.value.name).toBe('character-edit')
      expect(testRouter.currentRoute.value.params.id).toBe('luffy-123')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(CharacterEditView)
    })

    it('matches /characters/new to character-new', async () => {
      await testRouter.push('/characters/new')
      expect(testRouter.currentRoute.value.name).toBe('character-new')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(CharacterEditView)
    })
  })

  describe('location routes', () => {
    it('matches /locations to locations view', async () => {
      await testRouter.push('/locations')
      expect(testRouter.currentRoute.value.name).toBe('locations')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(LocationsView)
    })

    it('matches /locations/:id to location-detail', async () => {
      await testRouter.push('/locations/water7-123')
      expect(testRouter.currentRoute.value.name).toBe('location-detail')
      expect(testRouter.currentRoute.value.params.id).toBe('water7-123')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(LocationDetailView)
    })

    it('matches /locations/:id/edit to location-edit', async () => {
      await testRouter.push('/locations/water7-123/edit')
      expect(testRouter.currentRoute.value.name).toBe('location-edit')
      expect(testRouter.currentRoute.value.params.id).toBe('water7-123')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(LocationEditView)
    })

    it('matches /locations/new to location-new', async () => {
      await testRouter.push('/locations/new')
      expect(testRouter.currentRoute.value.name).toBe('location-new')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(LocationEditView)
    })
  })

  describe('saga routes', () => {
    it('matches /sagas to sagas view', async () => {
      await testRouter.push('/sagas')
      expect(testRouter.currentRoute.value.name).toBe('sagas')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(SagasView)
    })

    it('matches /sagas/:id to saga-edit', async () => {
      await testRouter.push('/sagas/water7-saga-123')
      expect(testRouter.currentRoute.value.name).toBe('saga-edit')
      expect(testRouter.currentRoute.value.params.id).toBe('water7-saga-123')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(SagaEditView)
    })

    it('matches /sagas/new to saga-new', async () => {
      await testRouter.push('/sagas/new')
      expect(testRouter.currentRoute.value.name).toBe('saga-new')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(SagaEditView)
    })
  })

  describe('arc routes', () => {
    it('matches /arcs to arcs view', async () => {
      await testRouter.push('/arcs')
      expect(testRouter.currentRoute.value.name).toBe('arcs')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(ArcsView)
    })

    it('matches /arcs/:id to arc-edit', async () => {
      await testRouter.push('/arcs/enies-lobby-123')
      expect(testRouter.currentRoute.value.name).toBe('arc-edit')
      expect(testRouter.currentRoute.value.params.id).toBe('enies-lobby-123')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(ArcEditView)
    })

    it('matches /arcs/new to arc-new', async () => {
      await testRouter.push('/arcs/new')
      expect(testRouter.currentRoute.value.name).toBe('arc-new')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(ArcEditView)
    })
  })

  describe('era routes', () => {
    it('matches /eras to eras view', async () => {
      await testRouter.push('/eras')
      expect(testRouter.currentRoute.value.name).toBe('eras')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(ErasView)
    })

    it('matches /eras/:id to era-edit', async () => {
      await testRouter.push('/eras/golden-age-123')
      expect(testRouter.currentRoute.value.name).toBe('era-edit')
      expect(testRouter.currentRoute.value.params.id).toBe('golden-age-123')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(EraEditView)
    })

    it('matches /eras/new to era-new', async () => {
      await testRouter.push('/eras/new')
      expect(testRouter.currentRoute.value.name).toBe('era-new')
      expect(testRouter.currentRoute.value.matched[0].components.default).toBe(EraEditView)
    })
  })

  describe('route navigation by name', () => {
    it('can navigate to timeline by name', async () => {
      await testRouter.push({ name: 'timeline' })
      expect(testRouter.currentRoute.value.path).toBe('/')
    })

    it('can navigate to event-detail by name with params', async () => {
      await testRouter.push({ name: 'event-detail', params: { id: 'test-123' } })
      expect(testRouter.currentRoute.value.path).toBe('/event/test-123')
    })

    it('can navigate to character-edit by name with params', async () => {
      await testRouter.push({ name: 'character-edit', params: { id: 'luffy-123' } })
      expect(testRouter.currentRoute.value.path).toBe('/characters/luffy-123/edit')
    })

    it('can navigate to location-new by name', async () => {
      await testRouter.push({ name: 'location-new' })
      expect(testRouter.currentRoute.value.path).toBe('/locations/new')
    })
  })

  describe('route params', () => {
    it('correctly extracts id param from event route', async () => {
      await testRouter.push('/event/abc-123')
      expect(testRouter.currentRoute.value.params).toEqual({ id: 'abc-123' })
    })

    it('correctly extracts id param from character edit route', async () => {
      await testRouter.push('/characters/xyz-456/edit')
      expect(testRouter.currentRoute.value.params).toEqual({ id: 'xyz-456' })
    })

    it('correctly extracts id param from location detail route', async () => {
      await testRouter.push('/locations/loc-789')
      expect(testRouter.currentRoute.value.params).toEqual({ id: 'loc-789' })
    })

    it('correctly extracts id param from saga route', async () => {
      await testRouter.push('/sagas/saga-321')
      expect(testRouter.currentRoute.value.params).toEqual({ id: 'saga-321' })
    })

    it('correctly extracts id param from arc route', async () => {
      await testRouter.push('/arcs/arc-654')
      expect(testRouter.currentRoute.value.params).toEqual({ id: 'arc-654' })
    })
  })

  describe('route path resolution', () => {
    it('resolves route by location object', () => {
      const resolved = testRouter.resolve({ name: 'event-detail', params: { id: '123' } })
      expect(resolved.path).toBe('/event/123')
    })

    it('resolves route with special characters in params', () => {
      const resolved = testRouter.resolve({ name: 'character-detail', params: { id: 'test-id-123' } })
      expect(resolved.path).toBe('/characters/test-id-123')
    })
  })
})
