# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collaborative wiki-style timeline application for tracking One Piece manga events with full version history, source verification, and character filtering. Built with Ktor (Kotlin backend) and Vue.js 3 (frontend).

## Build and Development Commands

### Backend (Ktor)
```bash
# Build the project
./gradlew build

# Run the server (port 8080)
./gradlew run

# Run with auto-reload
./gradlew run --continuous

# Run tests
./gradlew test

# Build production JAR
./gradlew buildFatJar
```

### Frontend (Vue.js)
```bash
cd frontend

# Install dependencies
npm install

# Development server with hot reload (port 3000)
npm run dev

# Build for production (outputs to src/main/resources/static/dist/)
npm run build

# Preview production build
npm run preview
```

### Database Setup
MongoDB must be running on `mongodb://localhost:27017` with database name `one_piece_timeline`. Configuration is in `src/main/resources/application.yaml`.

To create an initial admin user:
```bash
mongosh
use one_piece_timeline
db.users.insertOne({
  username: "admin",
  apiKey: "your-secret-api-key-here",
  role: "Admin",
  createdAt: NumberLong(Date.now()),
  isActive: true
})
```

### API Documentation
The project includes OpenAPI 3.0.3 specification and Swagger UI for interactive API documentation:

**Swagger UI** (http://localhost:8080/swagger)
- Interactive web interface for testing API endpoints
- Browse all available endpoints with request/response schemas
- Test API calls directly from the browser with authentication support

**OpenAPI Spec** (http://localhost:8080/openapi)
- Raw OpenAPI 3.0.3 specification in JSON format
- Can be imported into API tools (Postman, Insomnia, etc.)
- Useful for generating client SDKs

The specification file is located at `src/main/resources/openapi/documentation.yaml`. See `OPENAPI_SETUP.md` for detailed documentation.

## Architecture

### Backend Structure
The backend follows a layered architecture pattern:

**Routes Layer** (`src/main/kotlin/routes/`)
- Defines HTTP endpoints and request/response handling
- Five main route files: EventRoutes, CharacterRoutes, ArcRoutes, SagaRoutes, UserRoutes
- All route functions are extension functions on `Route` and registered in `Routing.kt`

**Repository Layer** (`src/main/kotlin/repository/`)
- Data access layer interfacing with MongoDB
- Each repository handles CRUD operations and queries for its domain model
- EventRepository includes special methods for version history and date calculations
- CharacterRepository includes private methods for calculating character birth/death dates using DateCalculator utilities

**Middleware** (`src/main/kotlin/middleware/`)
- `AuthMiddleware.kt`: API key-based authentication with role-based access control
- Extension functions: `authenticateUser()`, `requireEditor()`, `requireAdmin()`
- Three user roles: Viewer (read-only), Editor (create/edit), Admin (full access including delete/revert)

**Models** (`src/main/kotlin/model/`)
- Domain models with Kotlinx Serialization
- Events support three date types: Exact, Relative (to another event), Approximation
- `EventVersion.kt` tracks full version history for wiki-style editing

**Utilities** (`src/main/kotlin/util/`)
- `DateCalculator.kt`: Provides shared date calculation utilities including:
  - Converting between date formats (ExactDate to absolute days and vice versa)
  - Calculating absolute dates from relative dates with circular dependency detection
  - Converting time units to days
  - Public helper functions used by repositories for date calculations

**Configuration** (`src/main/kotlin/config/`)
- `DatabaseConfig.kt`: MongoDB client initialization and lifecycle management

### Key Architectural Patterns

**Version History System**
Every event modification creates a new `EventVersion` record with:
- Full event snapshot at that version
- Version number (auto-incremented)
- Username who made the change
- Timestamp

Admins can revert to any previous version, which creates a new version (never overwrites history).

**Date Calculation System**
Events can have three date types:
1. **Exact**: Specific year/month/day
2. **Relative**: Offset from another event (e.g., "3 days after event X")
3. **Approximation**: Text description only

The system:
- Calculates `calculatedAbsoluteDate` (days from year 0) for sortable timeline
- Resolves chains of relative dates recursively
- Detects and prevents circular dependencies
- Calculates `displayYear` for frontend display
- For relative dates, also calculates `calculatedExactDate` by converting absolute days back to year/month/day

**Authentication Flow**
1. API key passed in `X-API-Key` header
2. Middleware validates key and retrieves user from database
3. Route handlers check role requirements using extension functions
4. Public endpoints (GET) don't require authentication

### MongoDB Collections
- `events`: Main event documents with calculated date fields
- `event_versions`: Complete version history
- `characters`: Character data including birth/death dates
- `arcs`: Story arc metadata
- `sagas`: Saga metadata
- `users`: User accounts with API keys and roles

## Important Implementation Notes

### When Creating/Updating Events
Always call date calculation functions in the repository layer before saving:
- `DateCalculator.calculateAbsoluteDate()`: Computes sortable absolute date
- `DateCalculator.calculateExactDate()`: For relative dates, computes the full date
- Set `displayYear` for frontend rendering

### Authentication in Routes
Use the middleware extension functions consistently:
```kotlin
val user = call.requireEditor(authMiddleware) ?: return@post
```
The `?: return@post` pattern ensures early exit if authentication fails (middleware already sent error response).

### Version History
When updating events, always:
1. Increment version number
2. Create new `EventVersion` record
3. Preserve `createdAt` and `createdBy` from original

### Source Verification
All events require at least one source citation. Validation happens in route handlers before repository calls.

## JVM Toolchain
Project uses JDK 21 as specified in `build.gradle.kts` with `jvmToolchain(21)`.
