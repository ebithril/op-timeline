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

        <div class="flex gap-2 mt-3">
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
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!charactersStore.loading && filteredCharacters.length === 0" class="text-center py-8 text-gray-600">
      No characters found. Add some characters to get started!
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCharactersStore } from '../stores/characters'
import { useAuthStore } from '../stores/auth'

const charactersStore = useCharactersStore()
const authStore = useAuthStore()

const searchQuery = ref('')

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
