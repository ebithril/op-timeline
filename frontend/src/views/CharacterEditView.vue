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
              v-model="useBirthKaienrekiInput"
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
              v-model="useBirthRelativeYearInput"
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
            <div v-if="useBirthRelativeYearInput" class="space-y-2">
              <!-- Reference year selector -->
              <select
                v-model="birthReferenceYear"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary text-sm"
              >
                <option :value="1539">Series Start (1539)</option>
                <option :value="1541">Timeskip End (1541)</option>
              </select>

              <!-- Relative offset input -->
              <input
                v-model.number="birthRelativeYearOffset"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="e.g., -22 (22 years before)"
              />

              <!-- Show calculated absolute year -->
              <p class="text-xs text-gray-600">
                = Year {{ calculatedBirthAbsoluteYear }}
              </p>
            </div>
            <div v-else>
              <input
                v-model.number="displayedBirthYear"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                :placeholder="useBirthKaienrekiInput ? 'e.g., 1500' : 'e.g., 4100'"
              />
              <p v-if="!useBirthKaienrekiInput && birthDateYear != null" class="text-xs text-gray-500 mt-1">
                Kaienreki: {{ birthDateYear }}
              </p>
            </div>
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

        <!-- Toggle for calendar input mode -->
        <div class="mb-3">
          <label class="flex items-center gap-2">
            <input
              v-model="useDeathKaienrekiInput"
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
              v-model="useDeathRelativeYearInput"
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
            <div v-if="useDeathRelativeYearInput" class="space-y-2">
              <!-- Reference year selector -->
              <select
                v-model="deathReferenceYear"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary text-sm"
              >
                <option :value="1539">Series Start (1539)</option>
                <option :value="1541">Timeskip End (1541)</option>
              </select>

              <!-- Relative offset input -->
              <input
                v-model.number="deathRelativeYearOffset"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                placeholder="e.g., -2 (2 years before)"
              />

              <!-- Show calculated absolute year -->
              <p class="text-xs text-gray-600">
                = Year {{ calculatedDeathAbsoluteYear }}
              </p>
            </div>
            <div v-else>
              <input
                v-model.number="displayedDeathYear"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-one-piece-primary"
                :placeholder="useDeathKaienrekiInput ? 'e.g., 1520' : 'e.g., 4120'"
              />
              <p v-if="!useDeathKaienrekiInput && deathDateYear != null" class="text-xs text-gray-500 mt-1">
                Kaienreki: {{ deathDateYear }}
              </p>
            </div>
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
import { SERIES_START_YEAR, TIMESKIP_END_YEAR, relativeToAbsolute, absoluteToRelative, kaienrekiToTenreki, tenrekiToKaienreki } from '../utils/yearDisplay'

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

// Calendar input modes (Kaienreki vs Tenreki)
const useBirthKaienrekiInput = ref(true)
const useDeathKaienrekiInput = ref(true)

// Computed properties for displayed years (converts between calendars)
const displayedBirthYear = computed({
  get: () => {
    if (birthDateYear.value == null) return null
    return useBirthKaienrekiInput.value ? birthDateYear.value : kaienrekiToTenreki(birthDateYear.value)
  },
  set: (val) => {
    if (val == null) {
      birthDateYear.value = null
    } else {
      birthDateYear.value = useBirthKaienrekiInput.value ? val : tenrekiToKaienreki(val)
    }
  }
})

const displayedDeathYear = computed({
  get: () => {
    if (deathDateYear.value == null) return null
    return useDeathKaienrekiInput.value ? deathDateYear.value : kaienrekiToTenreki(deathDateYear.value)
  },
  set: (val) => {
    if (val == null) {
      deathDateYear.value = null
    } else {
      deathDateYear.value = useDeathKaienrekiInput.value ? val : tenrekiToKaienreki(val)
    }
  }
})

// Birth date relative year input mode
const useBirthRelativeYearInput = ref(false)
const birthReferenceYear = ref(SERIES_START_YEAR)
const birthRelativeYearOffset = ref(0)

const calculatedBirthAbsoluteYear = computed(() => {
  return relativeToAbsolute(birthRelativeYearOffset.value, birthReferenceYear.value)
})

// Death date relative year input mode
const useDeathRelativeYearInput = ref(false)
const deathReferenceYear = ref(SERIES_START_YEAR)
const deathRelativeYearOffset = ref(0)

const calculatedDeathAbsoluteYear = computed(() => {
  return relativeToAbsolute(deathRelativeYearOffset.value, deathReferenceYear.value)
})

const characterData = ref({
  name: '',
  aliases: [],
  birthDate: null,
  deathDate: null,
  affiliation: '',
  description: '',
})

// Watch birth relative year input mode changes
watch(useBirthRelativeYearInput, (newValue) => {
  if (newValue && birthDateYear.value != null) {
    // Switching TO relative mode: convert absolute year to relative offset
    birthRelativeYearOffset.value = absoluteToRelative(birthDateYear.value, birthReferenceYear.value)
  } else if (!newValue && calculatedBirthAbsoluteYear.value != null) {
    // Switching FROM relative mode: use calculated absolute year
    birthDateYear.value = calculatedBirthAbsoluteYear.value
  }
})

// Watch birth relative year inputs and update the absolute year
watch([birthRelativeYearOffset, birthReferenceYear], () => {
  if (useBirthRelativeYearInput.value) {
    birthDateYear.value = calculatedBirthAbsoluteYear.value
  }
})

// Watch absolute birth year when not in relative mode
watch(birthDateYear, (newValue) => {
  if (!useBirthRelativeYearInput.value && newValue != null && birthReferenceYear.value != null) {
    // Update relative offset to stay in sync
    birthRelativeYearOffset.value = absoluteToRelative(newValue, birthReferenceYear.value)
  }
})

// Watch death relative year input mode changes
watch(useDeathRelativeYearInput, (newValue) => {
  if (newValue && deathDateYear.value != null) {
    // Switching TO relative mode: convert absolute year to relative offset
    deathRelativeYearOffset.value = absoluteToRelative(deathDateYear.value, deathReferenceYear.value)
  } else if (!newValue && calculatedDeathAbsoluteYear.value != null) {
    // Switching FROM relative mode: use calculated absolute year
    deathDateYear.value = calculatedDeathAbsoluteYear.value
  }
})

// Watch death relative year inputs and update the absolute year
watch([deathRelativeYearOffset, deathReferenceYear], () => {
  if (useDeathRelativeYearInput.value) {
    deathDateYear.value = calculatedDeathAbsoluteYear.value
  }
})

// Watch absolute death year when not in relative mode
watch(deathDateYear, (newValue) => {
  if (!useDeathRelativeYearInput.value && newValue != null && deathReferenceYear.value != null) {
    // Update relative offset to stay in sync
    deathRelativeYearOffset.value = absoluteToRelative(newValue, deathReferenceYear.value)
  }
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
