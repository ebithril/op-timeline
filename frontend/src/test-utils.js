import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach } from 'vitest'

// Create a fresh Pinia instance before each test
export function setupPinia() {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
  })
}

// Helper to mount components with Pinia and router
export function mountWithPinia(component, options = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(component, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
      },
      ...options.global,
    },
    ...options,
  })
}

// Helper to create a mock router
export function createMockRouter(routes = []) {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: {
      value: {
        name: 'home',
        params: {},
        query: {},
        ...routes[0],
      },
    },
  }
}

// Helper to create mock axios instance
export function createMockAxios() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
  }
}

// Helper to wait for async updates
export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
