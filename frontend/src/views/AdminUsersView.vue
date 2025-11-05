<template>
  <div class="admin-users-view">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-one-piece-dark">User Management</h1>
      <p class="text-gray-600 mt-2">Create and manage user accounts and API keys</p>
    </div>

    <!-- Create New User Form -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-xl font-bold mb-4">Create New User</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            v-model="newUser.username"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            placeholder="Enter username"
            :disabled="creating"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            v-model="newUser.role"
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
            :disabled="creating"
          >
            <option value="Viewer">Viewer (Read-only)</option>
            <option value="Editor">Editor (Create/Edit)</option>
            <option value="Admin">Admin (Full access)</option>
          </select>
        </div>

        <button
          @click="createUser"
          :disabled="!newUser.username.trim() || creating"
          class="px-6 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ creating ? 'Creating...' : 'Create User' }}
        </button>

        <div v-if="createError" class="bg-red-100 p-3 rounded text-red-700 text-sm">
          {{ createError }}
        </div>
      </div>

      <!-- New API Key Display -->
      <div v-if="newApiKey" class="mt-6 p-4 bg-green-50 border border-green-300 rounded">
        <h3 class="text-lg font-bold text-green-800 mb-2">User Created Successfully!</h3>
        <p class="text-sm text-green-700 mb-3">
          Save this API key now - it won't be shown again:
        </p>
        <div class="flex items-center space-x-2">
          <code class="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm font-mono">
            {{ newApiKey }}
          </code>
          <button
            @click="copyApiKey"
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Existing Users List -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-bold mb-4">Existing Users</h2>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <p class="text-gray-600">Loading users...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-100 p-4 rounded text-red-700">
        {{ error }}
      </div>

      <!-- Users Table -->
      <div v-else-if="users.length > 0" class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b-2 border-gray-200">
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.username"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-3 px-4">
                <span class="font-medium">{{ user.username }}</span>
              </td>
              <td class="py-3 px-4">
                <span
                  class="px-2 py-1 rounded text-xs font-semibold"
                  :class="{
                    'bg-red-100 text-red-800': user.role === 'Admin',
                    'bg-blue-100 text-blue-800': user.role === 'Editor',
                    'bg-gray-100 text-gray-800': user.role === 'Viewer'
                  }"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="py-3 px-4">
                <span
                  class="px-2 py-1 rounded text-xs font-semibold"
                  :class="{
                    'bg-green-100 text-green-800': user.isActive,
                    'bg-gray-100 text-gray-800': !user.isActive
                  }"
                >
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex space-x-2">
                  <button
                    v-if="user.isActive"
                    @click="deactivateUser(user)"
                    class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Deactivate
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8 text-gray-600">
        No users found.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usersAPI } from '../services/api'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// Redirect if not admin
if (!authStore.isAdmin) {
  router.push('/')
}

const users = ref([])
const loading = ref(false)
const error = ref(null)

const newUser = ref({
  username: '',
  role: 'Viewer'
})

const creating = ref(false)
const createError = ref(null)
const newApiKey = ref(null)
const copied = ref(false)

async function fetchUsers() {
  loading.value = true
  error.value = null

  try {
    const response = await usersAPI.getAll()
    users.value = response.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch users'
  } finally {
    loading.value = false
  }
}

async function createUser() {
  if (!newUser.value.username.trim()) return

  creating.value = true
  createError.value = null
  newApiKey.value = null

  try {
    const response = await usersAPI.create(newUser.value.username, newUser.value.role)

    // Show the new API key
    newApiKey.value = response.data.apiKey

    // Reset form
    newUser.value.username = ''
    newUser.value.role = 'Viewer'

    // Refresh users list
    await fetchUsers()
  } catch (err) {
    createError.value = err.response?.data?.error || 'Failed to create user'
  } finally {
    creating.value = false
  }
}

async function deactivateUser(user) {
  if (!confirm(`Are you sure you want to deactivate user "${user.username}"?`)) {
    return
  }

  try {
    // Find the user's ID - we need to get it from the users list
    // The API requires the MongoDB _id, but the current response doesn't include it
    // For now, we'll use username as a workaround
    await usersAPI.deactivate(user._id || user.username)
    await fetchUsers()
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to deactivate user')
  }
}

function copyApiKey() {
  navigator.clipboard.writeText(newApiKey.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await fetchUsers()
})
</script>
