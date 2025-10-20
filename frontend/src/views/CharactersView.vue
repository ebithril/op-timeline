<template>
  <div class="characters-view">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-one-piece-dark">Characters</h1>
      <router-link
        v-if="authStore.isEditor"
        to="/characters/new"
        class="px-4 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
      >
        Add New Character
      </router-link>
    </div>

    <!-- Search Bar -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <input
        v-model="searchQuery"
        type="text"
        class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
        placeholder="Search characters..."
      />
    </div>

    <!-- Loading State -->
    <div v-if="charactersStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="charactersStore.error" class="bg-red-100 p-4 rounded text-red-700">
      {{ charactersStore.error }}
    </div>

    <!-- Characters List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="character in filteredCharacters"
        :key="character._id"
        class="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-gray-200"
      >
        <h3 class="text-xl font-bold mb-2 text-one-piece-dark">
          <router-link
            :to="`/characters/${character._id}`"
            class="hover:text-one-piece-primary"
          >
            {{ character.name }}
          </router-link>
        </h3>

        <div v-if="character.birthDate" class="text-sm text-gray-600 mb-1">
          <span class="font-semibold">Born:</span> Year {{ character.birthDate }}
        </div>

        <div v-if="character.deathDate" class="text-sm text-gray-600 mb-1">
          <span class="font-semibold">Died:</span> Year {{ character.deathDate }}
        </div>

        <div v-if="character.aliases && character.aliases.length > 0" class="text-sm text-gray-600 mb-2">
          <span class="font-semibold">Aliases:</span> {{ character.aliases.join(', ') }}
        </div>

        <div class="flex flex-wrap gap-2 mt-3">
          <button
            @click="toggleTimeline(character._id)"
            class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            {{ showingTimeline[character._id] ? 'Hide' : 'View' }} Timeline
          </button>
          <router-link
            v-if="authStore.isEditor"
            :to="`/characters/${character._id}/edit`"
            class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Edit
          </router-link>
          <button
            v-if="authStore.isAdmin"
            @click="deleteCharacter(character._id)"
            class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Delete
          </button>
        </div>

        <!-- Timeline -->
        <div v-if="showingTimeline[character._id]" class="mt-4 pt-4 border-t border-gray-200">
          <h4 class="text-sm font-semibold mb-2">Timeline ({{ characterTimelines[character._id]?.length || 0 }} events)</h4>
          <div v-if="loadingTimelines[character._id]" class="text-center py-2 text-gray-600 text-sm">
            Loading...
          </div>
          <div v-else-if="characterTimelines[character._id]?.length > 0" class="space-y-1">
            <router-link
              v-for="event in characterTimelines[character._id]"
              :key="event._id"
              :to="`/event/${event._id}`"
              class="block p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm transition"
            >
              <div class="font-semibold text-xs">{{ event.name }}</div>
              <div class="text-xs text-gray-600">{{ event.type }} - {{ formatEventDate(event) }}</div>
            </router-link>
          </div>
          <div v-else class="text-center py-2 text-gray-600 text-sm">
            No events yet
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!charactersStore.loading && filteredCharacters.length === 0" class="text-center py-8 text-gray-600">
      No characters found. Add some characters to get started!
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useCharactersStore } from '../stores/characters'
import { useAuthStore } from '../stores/auth'
import { charactersAPI } from '../services/api'

const charactersStore = useCharactersStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const showingTimeline = reactive({})
const loadingTimelines = reactive({})
const characterTimelines = reactive({})

const filteredCharacters = computed(() => {
  if (!searchQuery.value.trim()) {
    return charactersStore.sortedCharacters
  }

  const search = searchQuery.value.toLowerCase()
  return charactersStore.sortedCharacters.filter(char =>
    char.name.toLowerCase().includes(search) ||
    (char.aliases && char.aliases.some(alias => alias.toLowerCase().includes(search)))
  )
})

function formatEventDate(event) {
  if (event.displayYear) {
    return `Year ${event.displayYear}`
  }
  if (event.exactDate) {
    return `Year ${event.exactDate.year || event.exactDate}`
  }
  return 'Unknown date'
}

async function toggleTimeline(characterId) {
  showingTimeline[characterId] = !showingTimeline[characterId]

  if (showingTimeline[characterId] && !characterTimelines[characterId]) {
    loadingTimelines[characterId] = true
    try {
      const response = await charactersAPI.getTimeline(characterId)
      characterTimelines[characterId] = response.data
    } catch (error) {
      console.error('Failed to load character timeline:', error)
      characterTimelines[characterId] = []
    } finally {
      loadingTimelines[characterId] = false
    }
  }
}

async function deleteCharacter(id) {
  if (confirm('Are you sure you want to delete this character?')) {
    try {
      await charactersStore.deleteCharacter(id)
    } catch (error) {
      alert('Failed to delete character')
    }
  }
}

onMounted(async () => {
  await charactersStore.fetchAll()
})
</script>
