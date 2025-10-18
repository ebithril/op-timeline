<template>
  <div class="character-edit-view max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-one-piece-dark">
      {{ isNewCharacter ? 'Create New Character' : 'Edit Character' }}
    </h1>

    <!-- Loading State -->
    <div v-if="charactersStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="charactersStore.error" class="bg-red-100 p-4 rounded text-red-700 mb-4">
      {{ charactersStore.error }}
    </div>

    <!-- Character Form -->
    <form v-else @submit.prevent="saveCharacter" class="bg-white p-6 rounded-lg shadow">
      <!-- Name -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Name *</label>
        <input
          v-model="characterData.name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter character name"
        />
      </div>

      <!-- Aliases -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Aliases</label>
        <div class="space-y-2">
          <div v-for="(alias, index) in characterData.aliases" :key="index" class="flex gap-2">
            <input
              v-model="characterData.aliases[index]"
              type="text"
              class="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="Enter alias"
            />
            <button
              type="button"
              @click="removeAlias(index)"
              class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
          <button
            type="button"
            @click="addAlias"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Alias
          </button>
        </div>
      </div>

      <!-- Birth Date -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Birth Date</label>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Year</label>
            <input
              v-model.number="birthDateYear"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="e.g., 1500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Month</label>
            <input
              v-model.number="birthDateMonth"
              type="number"
              min="1"
              max="12"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1-12"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Day</label>
            <input
              v-model.number="birthDateDay"
              type="number"
              min="1"
              max="31"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1-31"
            />
          </div>
        </div>
      </div>

      <!-- Death Date -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Death Date (if applicable)</label>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Year</label>
            <input
              v-model.number="deathDateYear"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="e.g., 1520"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Month</label>
            <input
              v-model.number="deathDateMonth"
              type="number"
              min="1"
              max="12"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1-12"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Day</label>
            <input
              v-model.number="deathDateDay"
              type="number"
              min="1"
              max="31"
              class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
              placeholder="1-31"
            />
          </div>
        </div>
      </div>

      <!-- Affiliation -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Affiliation</label>
        <input
          v-model="characterData.affiliation"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="e.g., Straw Hat Pirates, Marines, etc."
        />
      </div>

      <!-- Description -->
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Description</label>
        <textarea
          v-model="characterData.description"
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
          placeholder="Enter character description"
        ></textarea>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-4">
        <button
          type="submit"
          class="px-6 py-2 bg-one-piece-primary text-white rounded hover:bg-one-piece-dark"
        >
          {{ isNewCharacter ? 'Create Character' : 'Save Changes' }}
        </button>
        <router-link
          to="/characters"
          class="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharactersStore } from '../stores/characters'

const route = useRoute()
const router = useRouter()
const charactersStore = useCharactersStore()

const characterId = computed(() => route.params.id)
const isNewCharacter = computed(() => !characterId.value || characterId.value === 'new')

// Date component refs
const birthDateYear = ref(null)
const birthDateMonth = ref(null)
const birthDateDay = ref(null)

const deathDateYear = ref(null)
const deathDateMonth = ref(null)
const deathDateDay = ref(null)

const characterData = ref({
  name: '',
  aliases: [],
  birthDate: null,
  deathDate: null,
  affiliation: '',
  description: '',
})

// Watch birth date components and update characterData.birthDate
watch([birthDateYear, birthDateMonth, birthDateDay], () => {
  if (birthDateYear.value) {
    characterData.value.birthDate = {
      year: birthDateYear.value,
      month: birthDateMonth.value || null,
      day: birthDateDay.value || null
    }
  } else {
    characterData.value.birthDate = null
  }
})

// Watch death date components and update characterData.deathDate
watch([deathDateYear, deathDateMonth, deathDateDay], () => {
  if (deathDateYear.value) {
    characterData.value.deathDate = {
      year: deathDateYear.value,
      month: deathDateMonth.value || null,
      day: deathDateDay.value || null
    }
  } else {
    characterData.value.deathDate = null
  }
})

function addAlias() {
  characterData.value.aliases.push('')
}

function removeAlias(index) {
  characterData.value.aliases.splice(index, 1)
}

async function saveCharacter() {
  try {
    // Clean up data
    const dataToSave = {
      ...characterData.value,
      aliases: characterData.value.aliases.filter(a => a.trim()),
    }

    if (isNewCharacter.value) {
      await charactersStore.create(dataToSave)
    } else {
      await charactersStore.update(characterId.value, dataToSave)
    }

    router.push('/characters')
  } catch (error) {
    console.error('Failed to save character:', error)
    alert('Failed to save character')
  }
}

onMounted(async () => {
  if (!isNewCharacter.value) {
    await charactersStore.fetchById(characterId.value)
    if (charactersStore.currentCharacter) {
      characterData.value = {
        name: charactersStore.currentCharacter.name || '',
        aliases: [...(charactersStore.currentCharacter.aliases || [])],
        birthDate: charactersStore.currentCharacter.birthDate || null,
        deathDate: charactersStore.currentCharacter.deathDate || null,
        affiliation: charactersStore.currentCharacter.affiliation || '',
        description: charactersStore.currentCharacter.description || '',
      }

      // Extract birth date components
      if (charactersStore.currentCharacter.birthDate) {
        birthDateYear.value = charactersStore.currentCharacter.birthDate.year || null
        birthDateMonth.value = charactersStore.currentCharacter.birthDate.month || null
        birthDateDay.value = charactersStore.currentCharacter.birthDate.day || null
      }

      // Extract death date components
      if (charactersStore.currentCharacter.deathDate) {
        deathDateYear.value = charactersStore.currentCharacter.deathDate.year || null
        deathDateMonth.value = charactersStore.currentCharacter.deathDate.month || null
        deathDateDay.value = charactersStore.currentCharacter.deathDate.day || null
      }
    }
  }
})
</script>
