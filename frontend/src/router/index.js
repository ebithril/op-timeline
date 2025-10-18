import { createRouter, createWebHistory } from 'vue-router'
import TimelineView from '../views/TimelineView.vue'
import EventDetailView from '../views/EventDetailView.vue'
import EventEditView from '../views/EventEditView.vue'
import CharactersView from '../views/CharactersView.vue'
import CharacterEditView from '../views/CharacterEditView.vue'
import SagasView from '../views/SagasView.vue'
import SagaEditView from '../views/SagaEditView.vue'
import ArcsView from '../views/ArcsView.vue'
import ArcEditView from '../views/ArcEditView.vue'

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
  ],
})

export default router
