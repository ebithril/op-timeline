import { createRouter, createWebHistory } from 'vue-router'
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

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
      path: '/eras',
      name: 'eras',
      component: ErasView,
    },
    {
      path: '/eras/:id',
      name: 'era-edit',
      component: EraEditView,
    },
  ],
})

export default router
