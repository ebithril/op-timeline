<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav class="bg-one-piece-blue text-white shadow-lg border-b-4 border-one-piece-yellow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <router-link to="/" class="text-2xl font-bold">
            One Piece Timeline Wiki
          </router-link>

          <div class="flex items-center space-x-4">
            <router-link
              to="/characters"
              class="text-white hover:text-gray-200"
            >
              Characters
            </router-link>

            <router-link
              to="/locations"
              class="text-white hover:text-gray-200"
            >
              Locations
            </router-link>

            <router-link
              to="/sagas"
              class="text-white hover:text-gray-200"
            >
              Sagas
            </router-link>

            <router-link
              to="/arcs"
              class="text-white hover:text-gray-200"
            >
              Arcs
            </router-link>

            <router-link
              to="/eras"
              class="text-white hover:text-gray-200"
            >
              Eras
            </router-link>

            <router-link
              v-if="authStore.isAdmin"
              to="/admin/users"
              class="text-white hover:text-gray-200"
            >
              Admin
            </router-link>

            <router-link
              v-if="authStore.isEditor"
              to="/event/new"
              class="bg-one-piece-red text-white px-4 py-2 rounded font-bold hover:bg-red-700 shadow-md transition-colors"
            >
              Add Event
            </router-link>

            <div v-if="authStore.isAuthenticated" class="flex items-center space-x-2">
              <span class="text-sm">{{ authStore.user?.username }} ({{ authStore.user?.role }})</span>
              <button
                @click="logout"
                class="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>

            <button
              v-else
              @click="showApiKeyDialog = true"
              class="bg-one-piece-yellow text-gray-900 px-4 py-2 rounded font-bold hover:bg-yellow-400 shadow-md transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="container mx-auto px-4 py-8">
      <router-view />
    </main>

    <!-- API Key Dialog -->
    <div
      v-if="showApiKeyDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showApiKeyDialog = false"
    >
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border-t-4 border-one-piece-blue">
        <h2 class="text-2xl font-bold mb-4 text-gray-900">Enter API Key</h2>
        <input
          v-model="apiKeyInput"
          type="text"
          placeholder="Your API Key"
          class="w-full px-4 py-2 border-2 border-gray-300 rounded mb-4 focus:border-one-piece-blue focus:outline-none"
          @keyup.enter="submitApiKey"
        />
        <div class="flex justify-end space-x-2">
          <button
            @click="showApiKeyDialog = false"
            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="submitApiKey"
            class="px-4 py-2 bg-one-piece-blue text-white rounded hover:bg-one-piece-blue-light font-bold transition-colors"
          >
            Login
          </button>
        </div>
        <p v-if="authStore.error" class="text-red-500 text-sm mt-2">
          {{ authStore.error }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const showApiKeyDialog = ref(false)
const apiKeyInput = ref('')

async function submitApiKey() {
  await authStore.setApiKey(apiKeyInput.value)
  if (authStore.isAuthenticated) {
    showApiKeyDialog.value = false
    apiKeyInput.value = ''
  }
}

function logout() {
  authStore.clearApiKey()
}
</script>
