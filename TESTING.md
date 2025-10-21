# Testing Documentation

This document provides comprehensive information about the testing infrastructure and practices for the One Piece Timeline project.

## Table of Contents

- [Overview](#overview)
- [Test Statistics](#test-statistics)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Running Tests](#running-tests)
- [CI/CD Pipeline](#cicd-pipeline)
- [Writing New Tests](#writing-new-tests)
- [Best Practices](#best-practices)

## Overview

The One Piece Timeline project uses a comprehensive testing strategy with both backend (Kotlin/Ktor) and frontend (Vue.js) test suites. The project aims for 90%+ code coverage with a mix of unit tests, integration tests, and component tests.

### Test Stack

**Backend:**
- JUnit 5 - Test framework
- Kotlin Test - Kotlin-specific testing utilities
- MockK - Mocking library for Kotlin
- Kotest - Assertion library with expressive matchers
- Kotlinx Coroutines Test - Testing utilities for coroutines

**Frontend:**
- Vitest - Modern, fast test runner for Vite projects
- Vue Test Utils - Official testing utilities for Vue.js
- Happy DOM - Lightweight DOM implementation for testing
- Pinia Testing - State management testing utilities

## Test Statistics

### Current Coverage (as of last update)

**Backend Tests: 49 tests**
- DateCalculator: 26 tests
- CharacterDateCalculator: 23 tests

**Frontend Tests: 161 tests**
- yearDisplay utility: 54 tests
- Events store: 34 tests
- Auth store: 29 tests
- Characters store: 23 tests
- Arcs store: 8 tests
- Locations store: 8 tests
- Sagas store: 5 tests

**Total: 210 passing tests**

### Coverage Targets

The project enforces the following minimum coverage thresholds for frontend code:

- Lines: 85%
- Functions: 85%
- Branches: 80%
- Statements: 85%

## Backend Testing

### Test Structure

Backend tests are located in `src/test/kotlin/` and mirror the main source structure:

```
src/test/kotlin/
├── helpers/
│   └── TestHelpers.kt          # Test data builders
├── util/
│   ├── DateCalculatorTest.kt
│   └── CharacterDateCalculatorTest.kt
└── repository/
    └── EventRepositoryTest.kt
```

### Test Helpers

The `TestHelpers.kt` file provides convenient test data builders for all domain models:

```kotlin
import helpers.TestData

// Create a test event
val event = TestData.createEvent(
    name = "Test Event",
    exactDate = ExactDate(year = 1520, month = 7, day = 22)
)

// Create a test character
val character = TestData.createCharacter(
    name = "Luffy",
    birthDate = ExactDate(year = 1500, month = 5, day = 5)
)
```

### Key Test Files

#### DateCalculatorTest.kt (26 tests)

Tests the date calculation system that powers the timeline:

- **Date Conversions**: Converting between ExactDate and absolute days
- **Time Units**: Converting minutes, hours, days, weeks, months, years to days
- **Relative Dates**: Calculating dates relative to other events
- **Circular Dependencies**: Detecting and handling circular event references
- **Edge Cases**: Year 0, null values, vague relative dates

```kotlin
@Test
fun `calculateAbsoluteDate - chain of relative dates`() = runTest {
    val event1 = TestData.createEvent(
        exactDate = ExactDate(year = 1500, month = 1, day = 1)
    )
    val event2 = TestData.createEvent(
        relativeEventId = event1._id,
        relativeOffset = 10,
        relativeTimeUnit = TimeUnit.Days
    )
    // Event 2 should be 10 days after event 1
}
```

#### CharacterDateCalculatorTest.kt (23 tests)

Tests character birth/death date calculations:

- **Birth Dates**: From exact dates, from events, with offsets
- **Death Dates**: From exact dates, from events, with offsets
- **Display Years**: Calculating years for UI display
- **Edge Cases**: Missing data, null events, event references

```kotlin
@Test
fun `calculateBirthDate - applies offset to birth event`() = runTest {
    val birthEvent = TestData.createEvent(
        calculatedAbsoluteDate = 1520.0 * 365.0
    )
    val character = TestData.createCharacter(
        birthEventId = birthEvent._id,
        birthRelativeOffset = 10,
        birthRelativeTimeUnit = TimeUnit.Days
    )
    // Birth date should be 10 days after event
}
```

### Running Backend Tests

```bash
# Run all backend unit tests
./gradlew test --tests DateCalculatorTest --tests CharacterDateCalculatorTest

# Run specific test
./gradlew test --tests DateCalculatorTest."exactDateToDays - full date"

# Run with detailed output
./gradlew test --info

# Generate test report
./gradlew test
# View report at: build/reports/tests/test/index.html
```

## Frontend Testing

### Test Structure

Frontend tests are co-located with source files for easier maintenance:

```
frontend/src/
├── utils/
│   ├── yearDisplay.js
│   └── yearDisplay.test.js
├── stores/
│   ├── events.js
│   ├── events.test.js
│   ├── auth.js
│   ├── auth.test.js
│   └── ...
└── test-utils.js             # Shared testing utilities
```

### Test Utilities

The `test-utils.js` file provides helpers for testing Vue components with Pinia:

```javascript
import { mountWithPinia, createMockRouter, createMockAxios } from '@/test-utils'

// Mount component with Pinia store
const wrapper = mountWithPinia(MyComponent, {
  props: { eventId: '123' }
})

// Create mock router
const router = createMockRouter()

// Create mock axios
const axios = createMockAxios()
```

### Key Test Suites

#### yearDisplay.test.js (54 tests)

Tests the year display utility that handles the three display modes:

- **Constants**: SERIES_START_YEAR, TIMESKIP_END_YEAR
- **Conversions**: absoluteToRelative, relativeToAbsolute
- **Formatting**: All three display modes (Kaienreki, Series Start, Timeskip End)
- **localStorage**: Saving and loading preferences
- **Edge Cases**: Null values, invalid modes, round trips

```javascript
describe('formatYearDisplay', () => {
  it('formats in Kaienreki mode', () => {
    expect(formatYearDisplay(1520, DisplayMode.KAIENREKI)).toBe('1520')
  })

  it('formats in Series Start mode', () => {
    expect(formatYearDisplay(1525, DisplayMode.SERIES_START)).toBe('+3 years')
  })
})
```

#### Store Tests (107 tests total)

Each Pinia store has comprehensive tests covering:

- **Initial State**: All reactive refs start with correct values
- **Computed Properties**: Derived state calculations (sorting, filtering)
- **Actions**: Async operations (fetch, create, update, delete)
- **Error Handling**: API failures, network errors
- **Loading States**: Loading flags during async operations

Example from events store:

```javascript
describe('useEventsStore', () => {
  it('sorts events by calculatedAbsoluteDate', () => {
    const store = useEventsStore()
    store.events = [
      { calculatedAbsoluteDate: 555000 },
      { calculatedAbsoluteDate: 554000 }
    ]

    expect(store.sortedEvents[0].calculatedAbsoluteDate).toBe(554000)
  })

  it('fetches all events successfully', async () => {
    eventsAPI.getAll = vi.fn().mockResolvedValue({ data: mockEvents })

    await store.fetchAll()

    expect(store.events).toEqual(mockEvents)
    expect(store.loading).toBe(false)
  })
})
```

### Running Frontend Tests

```bash
cd frontend

# Run all tests once
npm test

# Run tests in watch mode (interactive)
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
# View report at: frontend/coverage/index.html

# Run specific test file
npm test yearDisplay.test.js

# Run tests matching pattern
npm test -- -t "sortedEvents"
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment. The pipeline runs on every push and pull request to `main` and `develop` branches.

### Workflow Jobs

1. **backend-tests**: Runs Kotlin/Ktor unit tests
2. **frontend-tests**: Runs Vue.js/Vitest tests with coverage
3. **backend-build**: Builds the Ktor backend JAR
4. **frontend-build**: Builds the Vue.js frontend for production
5. **code-quality**: Runs linters and code quality checks
6. **integration-status**: Aggregates results and reports overall status

### Workflow Configuration

See `.github/workflows/ci.yml` for the complete configuration.

The workflow:
- Uses JDK 21 for backend (matches local development)
- Uses Node.js 18 for frontend
- Caches Gradle and npm dependencies for faster builds
- Uploads test results and coverage reports as artifacts
- Fails if any test suite fails

### Viewing CI Results

After pushing code:
1. Navigate to the "Actions" tab in GitHub
2. Click on the latest workflow run
3. View individual job logs
4. Download artifacts (test reports, coverage)

## Writing New Tests

### Backend Test Template

```kotlin
package util

import helpers.TestData
import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import kotlin.test.Test

class MyServiceTest {

    @Test
    fun `should do something`() = runTest {
        // Arrange
        val mockRepo = mockk<EventRepository>()
        val testEvent = TestData.createEvent(name = "Test")
        coEvery { mockRepo.findById(any()) } returns testEvent

        // Act
        val result = myService.doSomething(testEvent)

        // Assert
        result shouldBe expectedValue
    }
}
```

### Frontend Test Template

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMyStore } from './myStore'
import { myAPI } from '../services/api'

vi.mock('../services/api')

describe('useMyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should do something', async () => {
    // Arrange
    const store = useMyStore()
    myAPI.getData = vi.fn().mockResolvedValue({ data: mockData })

    // Act
    await store.fetchData()

    // Assert
    expect(store.data).toEqual(mockData)
    expect(store.loading).toBe(false)
  })
})
```

## Best Practices

### General

1. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
2. **One Assertion Per Test**: Each test should verify one specific behavior
3. **Descriptive Names**: Use backtick strings for readable test names
4. **Test Isolation**: Each test should be independent and not rely on others
5. **Mock External Dependencies**: Always mock API calls, databases, and external services

### Backend

1. **Use Test Helpers**: Leverage `TestData` builders for consistent test data
2. **Test Coroutines**: Use `runTest` for suspending functions
3. **Mock Repositories**: Use MockK for repository mocking
4. **Verify Assertions**: Use Kotest matchers for expressive assertions

### Frontend

1. **Reset State**: Use `beforeEach` to create fresh Pinia instances
2. **Mock API Calls**: Always mock the services/api module
3. **Test Loading States**: Verify loading flags during async operations
4. **Test Error Handling**: Verify error messages and state after failures
5. **Test Computed Properties**: Ensure reactive computed values update correctly

### Don't

1. ❌ Don't test implementation details
2. ❌ Don't write brittle tests that break with UI changes
3. ❌ Don't skip error cases
4. ❌ Don't test third-party libraries
5. ❌ Don't commit failing tests

## Troubleshooting

### Common Issues

**Backend: Tests require MongoDB**

Some integration tests (like EventRepositoryTest) require a running MongoDB instance. These are currently documentation-style tests. To run them:

```bash
# Option 1: Start local MongoDB
docker run -d -p 27017:27017 mongo:latest

# Option 2: Use Testcontainers (future improvement)
# Add Testcontainers dependency and configure in tests
```

**Frontend: Module not found**

Ensure you're in the frontend directory:

```bash
cd frontend
npm install
npm test
```

**Frontend: Tests hang**

Clear Vitest cache:

```bash
cd frontend
rm -rf node_modules/.vitest
npm test
```

**Backend: Gradle permission denied**

Grant execute permission:

```bash
chmod +x gradlew
```

## Future Improvements

- [ ] Add integration tests for API routes (requires Testcontainers)
- [ ] Add E2E tests with Playwright or Cypress
- [ ] Add visual regression testing
- [ ] Add mutation testing to verify test quality
- [ ] Add performance benchmarks
- [ ] Add contract testing between frontend and backend
- [ ] Add accessibility testing with axe-core

## Contributing

When contributing new features:

1. Write tests first (TDD) or alongside implementation
2. Ensure all existing tests pass
3. Add new test cases for edge cases
4. Update this documentation if adding new patterns
5. Run the full test suite before submitting PR:

```bash
# Backend
./gradlew test --tests DateCalculatorTest --tests CharacterDateCalculatorTest

# Frontend
cd frontend && npm test
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [MockK](https://mockk.io/)
- [Kotest](https://kotest.io/)
- [JUnit 5](https://junit.org/junit5/)
