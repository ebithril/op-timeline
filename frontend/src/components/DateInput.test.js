import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DateInput from './DateInput.vue'
import { nextTick } from 'vue'

describe('DateInput', () => {
  const defaultProps = {
    label: 'Test Date',
    dateType: 'Exact',
    exactYear: null,
    exactMonth: null,
    exactDay: null,
    relativeType: 'event',
    selectedRelativeEra: null,
    selectedRelativeEvent: null,
    offsetAmount: null,
    direction: 'After',
    timeUnit: 'Days',
    isVagueRelative: false,
    approximateDescription: '',
    eras: [],
    events: []
  }

  function createWrapper(props = {}) {
    return mount(DateInput, {
      props: {
        ...defaultProps,
        ...props
      }
    })
  }

  describe('component rendering', () => {
    it('renders the label', () => {
      const wrapper = createWrapper({ label: 'Event Date' })
      expect(wrapper.text()).toContain('Event Date')
    })

    it('renders date type selector', () => {
      const wrapper = createWrapper()
      const select = wrapper.find('select')
      expect(select.exists()).toBe(true)

      const options = select.findAll('option')
      expect(options).toHaveLength(3)
      expect(options[0].text()).toBe('Exact')
      expect(options[1].text()).toBe('Approximation')
      expect(options[2].text()).toBe('Relative')
    })

    it('displays exact date inputs when dateType is Exact', () => {
      const wrapper = createWrapper({ dateType: 'Exact' })

      const inputs = wrapper.findAll('input[type="number"]')
      expect(inputs.length).toBeGreaterThanOrEqual(3) // Year, Month, Day
    })

    it('displays approximation input when dateType is Approximation', () => {
      const wrapper = createWrapper({ dateType: 'Approximation' })

      expect(wrapper.text()).toContain('Description')
      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)
      expect(input.attributes('placeholder')).toContain('Long ago')
    })

    it('displays relative date inputs when dateType is Relative', () => {
      const wrapper = createWrapper({ dateType: 'Relative' })

      expect(wrapper.text()).toContain('Reference Type')
      expect(wrapper.text()).toContain('Offset Amount')
      expect(wrapper.text()).toContain('Direction')
      expect(wrapper.text()).toContain('Time Unit')
    })
  })

  describe('exact date functionality', () => {
    it('emits update:exactYear when year input changes', async () => {
      const wrapper = createWrapper({ dateType: 'Exact' })

      const yearInput = wrapper.findAll('input[type="number"]')[0]
      await yearInput.setValue('1520')

      expect(wrapper.emitted('update:exactYear')).toBeTruthy()
      expect(wrapper.emitted('update:exactYear')[0]).toEqual([1520])
    })

    it('emits update:exactMonth when month input changes', async () => {
      const wrapper = createWrapper({ dateType: 'Exact' })

      const monthInput = wrapper.findAll('input[type="number"]')[1]
      await monthInput.setValue('5')

      expect(wrapper.emitted('update:exactMonth')).toBeTruthy()
      expect(wrapper.emitted('update:exactMonth')[0]).toEqual([5])
    })

    it('emits update:exactDay when day input changes', async () => {
      const wrapper = createWrapper({ dateType: 'Exact' })

      const dayInput = wrapper.findAll('input[type="number"]')[2]
      await dayInput.setValue('10')

      expect(wrapper.emitted('update:exactDay')).toBeTruthy()
      expect(wrapper.emitted('update:exactDay')[0]).toEqual([10])
    })

    it('emits null when year input is cleared', async () => {
      const wrapper = createWrapper({ dateType: 'Exact', exactYear: 1520 })

      const yearInput = wrapper.findAll('input[type="number"]')[0]
      await yearInput.setValue('')

      expect(wrapper.emitted('update:exactYear')).toBeTruthy()
      const emittedValues = wrapper.emitted('update:exactYear')
      expect(emittedValues[emittedValues.length - 1]).toEqual([null])
    })
  })

  describe('relative date functionality', () => {
    it('emits update:relativeType when reference type changes', async () => {
      const wrapper = createWrapper({ dateType: 'Relative' })

      const select = wrapper.findAll('select')[1] // First select is dateType
      await select.setValue('era')

      expect(wrapper.emitted('update:relativeType')).toBeTruthy()
      expect(wrapper.emitted('update:relativeType')[0]).toEqual(['era'])
    })

    it('clears selections when relativeType changes', async () => {
      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'event',
        selectedRelativeEvent: { _id: 'e1', name: 'Test Event' }
      })

      const select = wrapper.findAll('select')[1]
      await select.setValue('era')

      expect(wrapper.emitted('update:selectedRelativeEvent')).toBeTruthy()
      expect(wrapper.emitted('update:selectedRelativeEvent')[0]).toEqual([null])
      expect(wrapper.emitted('update:selectedRelativeEra')).toBeTruthy()
      expect(wrapper.emitted('update:selectedRelativeEra')[0]).toEqual([null])
    })

    it('displays era search when relativeType is era', () => {
      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'era'
      })

      expect(wrapper.text()).toContain('Select Era')
    })

    it('displays event search when relativeType is event', () => {
      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'event'
      })

      expect(wrapper.text()).toContain('Select Event')
    })

    it('filters eras based on search input', async () => {
      const eras = [
        { _id: 'e1', name: 'Great Pirate Era', startDisplayYear: 1500 },
        { _id: 'e2', name: 'Void Century', startDisplayYear: null },
        { _id: 'e3', name: 'Age of Pirates', startDisplayYear: 1498 }
      ]

      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'era',
        eras
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Pirate')
      await input.trigger('input')
      await input.trigger('focus')

      await nextTick()

      // Should show suggestions containing "Pirate"
      expect(wrapper.vm.filteredEraSuggestions).toHaveLength(2)
      expect(wrapper.vm.filteredEraSuggestions[0].name).toContain('Pirate')
    })

    it('filters events based on search input', async () => {
      const events = [
        { _id: 'e1', name: 'Battle of Marineford', type: 'Fight', displayYear: 1520 },
        { _id: 'e2', name: 'Luffy meets Shanks', type: 'Meeting', displayYear: 1510 },
        { _id: 'e3', name: 'Battle of Enies Lobby', type: 'Fight', displayYear: 1515 }
      ]

      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'event',
        events
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Battle')
      await input.trigger('input')
      await input.trigger('focus')

      await nextTick()

      expect(wrapper.vm.filteredEventSuggestions).toHaveLength(2)
      expect(wrapper.vm.filteredEventSuggestions[0].name).toContain('Battle')
    })

    it('shows all eras when search is empty', async () => {
      const eras = [
        { _id: 'e1', name: 'Great Pirate Era', startDisplayYear: 1500 },
        { _id: 'e2', name: 'Void Century', startDisplayYear: null }
      ]

      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'era',
        eras
      })

      expect(wrapper.vm.filteredEraSuggestions).toEqual(eras)
    })

    it('emits update:selectedRelativeEra when era is selected', async () => {
      const era = { _id: 'e1', name: 'Great Pirate Era', startDisplayYear: 1500 }
      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'era',
        eras: [era]
      })

      wrapper.vm.selectRelativeEra(era)

      expect(wrapper.emitted('update:selectedRelativeEra')).toBeTruthy()
      expect(wrapper.emitted('update:selectedRelativeEra')[0]).toEqual([era])
      expect(wrapper.emitted('update:selectedRelativeEvent')).toBeTruthy()
      expect(wrapper.emitted('update:selectedRelativeEvent')[0]).toEqual([null])
    })

    it('emits update:selectedRelativeEvent when event is selected', async () => {
      const event = { _id: 'e1', name: 'Battle of Marineford', type: 'Fight', displayYear: 1520 }
      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'event',
        events: [event]
      })

      wrapper.vm.selectRelativeEvent(event)

      expect(wrapper.emitted('update:selectedRelativeEvent')).toBeTruthy()
      expect(wrapper.emitted('update:selectedRelativeEvent')[0]).toEqual([event])
      expect(wrapper.emitted('update:selectedRelativeEra')).toBeTruthy()
      expect(wrapper.emitted('update:selectedRelativeEra')[0]).toEqual([null])
    })

    it('clears selected relative reference', () => {
      const wrapper = createWrapper({
        dateType: 'Relative',
        selectedRelativeEvent: { _id: 'e1', name: 'Test' }
      })

      wrapper.vm.clearRelative()

      expect(wrapper.emitted('update:selectedRelativeEvent')).toBeTruthy()
      expect(wrapper.emitted('update:selectedRelativeEvent')[0]).toEqual([null])
      expect(wrapper.emitted('update:selectedRelativeEra')).toBeTruthy()
      expect(wrapper.emitted('update:selectedRelativeEra')[0]).toEqual([null])
    })
  })

  describe('offset and direction functionality', () => {
    it('emits update:offsetAmount when offset changes', async () => {
      const wrapper = createWrapper({ dateType: 'Relative' })

      const input = wrapper.find('input[type="number"]')
      await input.setValue('5')

      expect(wrapper.emitted('update:offsetAmount')).toBeTruthy()
      expect(wrapper.emitted('update:offsetAmount')[0]).toEqual([5])
    })

    it('emits update:direction when direction changes', async () => {
      const wrapper = createWrapper({ dateType: 'Relative' })

      const selects = wrapper.findAll('select')
      const directionSelect = selects[2] // dateType, relativeType, direction
      await directionSelect.setValue('Before')

      expect(wrapper.emitted('update:direction')).toBeTruthy()
      expect(wrapper.emitted('update:direction')[0]).toEqual(['Before'])
    })

    it('emits update:timeUnit when time unit changes', async () => {
      const wrapper = createWrapper({ dateType: 'Relative' })

      const selects = wrapper.findAll('select')
      const timeUnitSelect = selects[3] // dateType, relativeType, direction, timeUnit
      await timeUnitSelect.setValue('Months')

      expect(wrapper.emitted('update:timeUnit')).toBeTruthy()
      expect(wrapper.emitted('update:timeUnit')[0]).toEqual(['Months'])
    })

    it('emits update:isVagueRelative when checkbox changes', async () => {
      const wrapper = createWrapper({ dateType: 'Relative' })

      const checkbox = wrapper.find('input[type="checkbox"]')
      await checkbox.setValue(true)

      expect(wrapper.emitted('update:isVagueRelative')).toBeTruthy()
      expect(wrapper.emitted('update:isVagueRelative')[0]).toEqual([true])
    })

    it('disables offset amount input when vague relative is enabled', () => {
      const wrapper = createWrapper({
        dateType: 'Relative',
        isVagueRelative: true
      })

      const offsetInput = wrapper.find('input[type="number"]')
      expect(offsetInput.attributes('disabled')).toBeDefined()
    })

    it('makes offset amount optional when vague relative is enabled', () => {
      const wrapper = createWrapper({
        dateType: 'Relative',
        isVagueRelative: true
      })

      expect(wrapper.text()).toContain('Offset Amount (optional)')
    })
  })

  describe('approximation date functionality', () => {
    it('emits update:approximateDescription when description changes', async () => {
      const wrapper = createWrapper({ dateType: 'Approximation' })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Long ago')

      expect(wrapper.emitted('update:approximateDescription')).toBeTruthy()
      expect(wrapper.emitted('update:approximateDescription')[0]).toEqual(['Long ago'])
    })

    it('displays placeholder for approximation description', () => {
      const wrapper = createWrapper({ dateType: 'Approximation' })

      const input = wrapper.find('input[type="text"]')
      expect(input.attributes('placeholder')).toContain('Long ago')
    })
  })

  describe('dateType changes', () => {
    it('emits update:dateType when date type selector changes', async () => {
      const wrapper = createWrapper({ dateType: 'Exact' })

      const select = wrapper.find('select')
      await select.setValue('Relative')

      expect(wrapper.emitted('update:dateType')).toBeTruthy()
      expect(wrapper.emitted('update:dateType')[0]).toEqual(['Relative'])
    })
  })

  describe('selected reference display', () => {
    it('displays selected era', () => {
      const era = { _id: 'e1', name: 'Great Pirate Era', startDisplayYear: 1500 }
      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'era',
        selectedRelativeEra: era
      })

      expect(wrapper.text()).toContain('Great Pirate Era')
      expect(wrapper.text()).toContain('Year 1500')
    })

    it('displays selected event', () => {
      const event = { _id: 'e1', name: 'Battle of Marineford', type: 'Fight', displayYear: 1520 }
      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'event',
        selectedRelativeEvent: event
      })

      expect(wrapper.text()).toContain('Battle of Marineford')
      expect(wrapper.text()).toContain('Fight')
      expect(wrapper.text()).toContain('Year 1520')
    })

    it('shows clear button when reference is selected', () => {
      const event = { _id: 'e1', name: 'Test Event', type: 'Event', displayYear: 1520 }
      const wrapper = createWrapper({
        dateType: 'Relative',
        selectedRelativeEvent: event
      })

      const clearButton = wrapper.find('button[type="button"]')
      expect(clearButton.exists()).toBe(true)
      expect(clearButton.text()).toBe('×')
    })
  })

  describe('autocomplete behavior', () => {
    it('shows era suggestions on focus', async () => {
      const eras = [
        { _id: 'e1', name: 'Great Pirate Era', startDisplayYear: 1500 }
      ]

      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'era',
        eras
      })

      const input = wrapper.find('input[type="text"]')
      await input.trigger('focus')

      await nextTick()

      expect(wrapper.vm.showEraSuggestions).toBe(true)
    })

    it('shows event suggestions on focus', async () => {
      const events = [
        { _id: 'e1', name: 'Test Event', type: 'Event', displayYear: 1520 }
      ]

      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'event',
        events
      })

      const input = wrapper.find('input[type="text"]')
      await input.trigger('focus')

      await nextTick()

      expect(wrapper.vm.showEventSuggestions).toBe(true)
    })

    it('filters suggestions on input', async () => {
      const events = [
        { _id: 'e1', name: 'Battle of Marineford', type: 'Fight', displayYear: 1520 },
        { _id: 'e2', name: 'Meeting with Shanks', type: 'Meeting', displayYear: 1510 }
      ]

      const wrapper = createWrapper({
        dateType: 'Relative',
        relativeType: 'event',
        events
      })

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Battle')
      await input.trigger('input')

      await nextTick()

      expect(wrapper.vm.filteredEventSuggestions).toHaveLength(1)
      expect(wrapper.vm.filteredEventSuggestions[0].name).toBe('Battle of Marineford')
    })
  })
})
