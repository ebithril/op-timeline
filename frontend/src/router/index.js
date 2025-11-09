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
import AdminUsersView from '../views/AdminUsersView.vue'
import { useAuthStore } from '../stores/auth'

// Navigation guard for routes requiring editor role
async function requireEditor(to, from, next) {
  const authStore = useAuthStore()

  // Wait for auth to finish loading if it's still loading
  if (authStore.loading) {
    await new Promise((resolve) => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.loading) {
          unwatch()
          resolve()
        }
      })
    })
  }

  // Check if user is editor or admin
  if (authStore.isEditor) {
    next()
  } else {
    next('/')
  }
}

// Navigation guard for routes requiring admin role
async function requireAdmin(to, from, next) {
  const authStore = useAuthStore()

  // Wait for auth to finish loading if it's still loading
  if (authStore.loading) {
    await new Promise((resolve) => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.loading) {
          unwatch()
          resolve()
        }
      })
    })
  }

  // Check if user is admin
  if (authStore.isAdmin) {
    next()
  } else {
    next('/')
  }
}

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
      beforeEnter: requireEditor,
    },
    {
      path: '/event/new',
      name: 'event-new',
      component: EventEditView,
      beforeEnter: requireEditor,
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
      beforeEnter: requireEditor,
    },
    {
      path: '/characters/new',
      name: 'character-new',
      component: CharacterEditView,
      beforeEnter: requireEditor,
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
      beforeEnter: requireEditor,
    },
    {
      path: '/locations/new',
      name: 'location-new',
      component: LocationEditView,
      beforeEnter: requireEditor,
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
      beforeEnter: requireEditor,
    },
    {
      path: '/sagas/new',
      name: 'saga-new',
      component: SagaEditView,
      beforeEnter: requireEditor,
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
      beforeEnter: requireEditor,
    },
    {
      path: '/arcs/new',
      name: 'arc-new',
      component: ArcEditView,
      beforeEnter: requireEditor,
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
      beforeEnter: requireEditor,
    },
    {
      path: '/eras/new',
      name: 'era-new',
      component: EraEditView,
      beforeEnter: requireEditor,
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersView,
      beforeEnter: requireAdmin,
    },
  ],
})

export default router
