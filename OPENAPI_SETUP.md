# OpenAPI and Swagger UI Setup

This document describes the OpenAPI and Swagger UI integration for the One Piece Timeline API.

## Overview

The project now includes full OpenAPI 3.0.3 specification and Swagger UI for interactive API documentation and testing.

## Dependencies Added

The following dependencies were added to `build.gradle.kts`:

```kotlin
// OpenAPI and Swagger UI
implementation("io.ktor:ktor-server-openapi")
implementation("io.ktor:ktor-server-swagger-ui")
```

## Endpoints

After starting the application, you can access:

### Swagger UI
- **URL**: http://localhost:8080/swagger
- **Description**: Interactive API documentation with a web interface for testing endpoints
- **Features**:
  - Browse all available API endpoints
  - View request/response schemas
  - Test API calls directly from the browser
  - See authentication requirements

### OpenAPI Specification
- **URL**: http://localhost:8080/openapi
- **Description**: Raw OpenAPI 3.0.3 specification in JSON format
- **Use Cases**:
  - Import into API testing tools (Postman, Insomnia, etc.)
  - Generate client SDKs
  - API contract validation

## API Documentation

The OpenAPI specification documents all major endpoints:

### Events API (`/api/events`)
- `GET /api/events` - Get all events (public)
- `POST /api/events` - Create event (requires Editor/Admin)
- `GET /api/events/{id}` - Get event by ID (public)
- `PUT /api/events/{id}` - Update event (requires Editor/Admin)
- `DELETE /api/events/{id}` - Delete event (requires Admin)
- `GET /api/events/character/{name}` - Get events by character (public)
- `GET /api/events/{id}/children` - Get child events (public)

### Characters API (`/api/characters`)
- `GET /api/characters` - Get all characters (public)
- `POST /api/characters` - Create character (requires Editor/Admin)
- `GET /api/characters/{id}` - Get character by ID (public)
- `PUT /api/characters/{id}` - Update character (requires Editor/Admin)
- `DELETE /api/characters/{id}` - Delete character (requires Admin)

### Arcs API (`/api/arcs`)
- `GET /api/arcs` - Get all arcs (public)
- `POST /api/arcs` - Create arc (requires Editor/Admin)

### Sagas API (`/api/sagas`)
- `GET /api/sagas` - Get all sagas (public)
- `POST /api/sagas` - Create saga (requires Editor/Admin)

### Users API (`/api/users`)
- `GET /api/users` - Get all users (requires Admin)
- `POST /api/users` - Create user (requires Admin)

### Monitoring
- `GET /metrics` - Prometheus metrics endpoint

## Authentication

The API uses API key authentication via the `X-API-Key` header.

### Roles
- **Viewer**: Read-only access (all GET endpoints)
- **Editor**: Can create and update resources (GET, POST, PUT)
- **Admin**: Full access including delete and user management (GET, POST, PUT, DELETE)

### Testing with Swagger UI

1. Start the application: `./gradlew run`
2. Navigate to http://localhost:8080/swagger
3. Click the "Authorize" button
4. Enter your API key in the `X-API-Key` field
5. Click "Authorize" to apply the key to all requests
6. Try out endpoints by clicking "Try it out" on any endpoint

## Files Modified/Created

### New Files
- `src/main/resources/openapi/documentation.yaml` - Complete OpenAPI 3.0.3 specification

### Modified Files
- `build.gradle.kts` - Added OpenAPI and Swagger UI dependencies
- `src/main/kotlin/Routing.kt` - Added `openAPI()` and `swaggerUI()` route configurations

## OpenAPI Specification Location

The OpenAPI specification file is located at:
```
src/main/resources/openapi/documentation.yaml
```

This YAML file contains:
- Complete API endpoint documentation
- Request/response schemas for all models (Event, Character, Arc, Saga, User, etc.)
- Authentication scheme definitions
- Detailed descriptions of all parameters and responses
- Error response schemas

## Updating the Specification

When adding new endpoints or modifying existing ones:

1. Update the OpenAPI spec file: `src/main/resources/openapi/documentation.yaml`
2. Add/modify paths under the `paths:` section
3. Add/modify schemas under `components.schemas:` if new models are introduced
4. Restart the application to see changes reflected in Swagger UI

## Benefits

- **Interactive Documentation**: Developers can explore and test the API without writing code
- **Contract-First Development**: The OpenAPI spec serves as a contract between frontend and backend
- **SDK Generation**: Can generate client libraries in various languages using the OpenAPI spec
- **Validation**: Tools can validate API responses against the specification
- **Onboarding**: New developers can quickly understand the API structure

## Notes

- Public endpoints (GET requests) don't require authentication
- Create, update, and delete operations require appropriate role permissions
- The Swagger UI respects CORS settings configured in the application
- The specification follows OpenAPI 3.0.3 standard
