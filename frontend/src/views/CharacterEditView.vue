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

        <!-- Toggle for calendar input mode -->
        <div class="mb-3">
          <label class="flex items-center gap-2">
            <input
              v-model="birthDate.useKaienrekiInput.value"
              type="checkbox"
              class="rounded"
            />
            <span class="text-sm font-semibold">Use Kaienreki (default)</span>
          </label>
          <p class="text-xs text-gray-600 mt-1 ml-6">Uncheck to input years in Tenreki (Sky Calendar, +2600 years)</p>
        </div>

        <!-- Toggle for relative year input -->
        <div class="mb-3">
          <label class="flex items-center gap-2">
            <input
              v-model="birthDate.useRelativeYearInput.value"
              type="checkbox"
              class="rounded"
            />
            <span class="text-sm font-semibold">Enter year relative to reference</span>
          </label>
          <p class="text-xs text-gray-600 mt-1 ml-6">Use this to enter dates relative to series start (1539) or timeskip end (1541)</p>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Year</label>
            <div v-if="birthDate.useRelativeYearInput.value" class="space-y-2">
              <!-- Reference year selector -->
              <select
                v-model="birthDate.referenceYear.value"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary text-sm"
              >
                <option :value="1539">Series Start (1539)</option>
                <option :value="1541">Timeskip End (1541)</option>
              </select>

              <!-- Relative offset input -->
              <input
                v-model.number="birthDate.relativeYearOffset.value"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="e.g., -22 (22 years before)"
              />

              <!-- Show calculated absolute year -->
              <p class="text-xs text-gray-600">
                = Year {{ birthDate.calculatedAbsoluteYear.value }}
              </p>
            </div>
            <div v-else>
              <input
                v-model.number="birthDate.displayedYear.value"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                :placeholder="birthDate.useKaienrekiInput.value ? 'e.g., 1500' : 'e.g., 4100'"
              />
              <p v-if="!birthDate.useKaienrekiInput.value && birthDate.dateYear.value != null" class="text-xs text-gray-500 mt-1">
                Kaienreki: {{ birthDate.dateYear.value }}
              </p>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Month</label>
            <input
              v-model.number="birthDate.dateMonth.value"
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
              v-model.number="birthDate.dateDay.value"
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

        <!-- Toggle for calendar input mode -->
        <div class="mb-3">
          <label class="flex items-center gap-2">
            <input
              v-model="deathDate.useKaienrekiInput.value"
              type="checkbox"
              class="rounded"
            />
            <span class="text-sm font-semibold">Use Kaienreki (default)</span>
          </label>
          <p class="text-xs text-gray-600 mt-1 ml-6">Uncheck to input years in Tenreki (Sky Calendar, +2600 years)</p>
        </div>

        <!-- Toggle for relative year input -->
        <div class="mb-3">
          <label class="flex items-center gap-2">
            <input
              v-model="deathDate.useRelativeYearInput.value"
              type="checkbox"
              class="rounded"
            />
            <span class="text-sm font-semibold">Enter year relative to reference</span>
          </label>
          <p class="text-xs text-gray-600 mt-1 ml-6">Use this to enter dates relative to series start (1539) or timeskip end (1541)</p>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Year</label>
            <div v-if="deathDate.useRelativeYearInput.value" class="space-y-2">
              <!-- Reference year selector -->
              <select
                v-model="deathDate.referenceYear.value"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary text-sm"
              >
                <option :value="1539">Series Start (1539)</option>
                <option :value="1541">Timeskip End (1541)</option>
              </select>

              <!-- Relative offset input -->
              <input
                v-model.number="deathDate.relativeYearOffset.value"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="e.g., -2 (2 years before)"
              />

              <!-- Show calculated absolute year -->
              <p class="text-xs text-gray-600">
                = Year {{ deathDate.calculatedAbsoluteYear.value }}
              </p>
            </div>
            <div v-else>
              <input
                v-model.number="deathDate.displayedYear.value"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                :placeholder="deathDate.useKaienrekiInput.value ? 'e.g., 1520' : 'e.g., 4120'"
              />
              <p v-if="!deathDate.useKaienrekiInput.value && deathDate.dateYear.value != null" class="text-xs text-gray-500 mt-1">
                Kaienreki: {{ deathDate.dateYear.value }}
              </p>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Month</label>
            <input
              v-model.number="deathDate.dateMonth.value"
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
              v-model.number="deathDate.dateDay.value"
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
import { useDateInput } from '../composables/useDateInput'

const route = useRoute()
const router = useRouter()
const charactersStore = useCharactersStore()

const characterId = computed(() => route.params.id)
const isNewCharacter = computed(() => !characterId.value || characterId.value === 'new')

// Use the composable for birth and death dates
const birthDate = useDateInput()
const deathDate = useDateInput()

const characterData = ref({
  name: '',
  aliases: [],
  birthDate: null,
  deathDate: null,
  affiliation: '',
  description: '',
})

// Watch birth date and update characterData
watch(birthDate.dateObject, (newValue) => {
  characterData.value.birthDate = newValue
})

// Watch death date and update characterData
watch(deathDate.dateObject, (newValue) => {
  characterData.value.deathDate = newValue
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

      // Load birth and death dates using the composable
      if (charactersStore.currentCharacter.birthDate) {
        birthDate.loadDate(charactersStore.currentCharacter.birthDate)
      }

      if (charactersStore.currentCharacter.deathDate) {
        deathDate.loadDate(charactersStore.currentCharacter.deathDate)
      }
    }
  }
})
</script>
