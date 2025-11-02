# One Piece Timeline Wiki

A collaborative wiki-style timeline for tracking events in the One Piece manga, with full version history, source verification, and character filtering.

## Features

- **Interactive Timeline**: View all One Piece events in chronological order
- **Source Verification**: Every event requires at least one verifiable source
- **Full Version History**: Track all changes with the ability to revert to any previous version
- **Character Filtering**: Filter timeline by characters to see when they were alive
- **Role-Based Access**:
  - Viewers can browse all content
  - Editors can create and modify events and characters
  - Admins can delete, revert changes, and manage users
- **Wiki-Style Editing**: Changes go live immediately with full audit trail
- **REST API**: Complete API for programmatic access

## Technology Stack

### Backend
- **Ktor** (Kotlin) - Web framework
- **MongoDB** - Database with KMongo driver
- **Kotlin Coroutines** - Async operations

### Frontend
- **Vue.js 3** - Reactive UI framework
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## Prerequisites

- **JDK 21** or higher
- **MongoDB** 4.4 or higher
- **Node.js** 18 or higher (for frontend development)
- **Gradle** (included via wrapper)

## Setup Instructions

### 1. MongoDB Setup

Install and start MongoDB:

```bash
# macOS (with Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo apt-get install mongodb
sudo systemctl start mongodb

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

The application is configured to connect to `mongodb://localhost:27017` with database name `one_piece_timeline`. You can modify this in `src/main/resources/application.yaml`.

### 2. Backend Setup

Build and run the Ktor backend:

```bash
# Build the project
./gradlew build

# Run the server
./gradlew run
```

The backend will start on `http://localhost:8080`.

### 3. Create an Admin User

You'll need to create an initial admin user directly in MongoDB:

```bash
# Connect to MongoDB
mongosh

# Switch to the database
use one_piece_timeline

# Create an admin user
db.users.insertOne({
  username: "admin",
  apiKey: "your-secret-api-key-here",
  role: "Admin",
  createdAt: NumberLong(Date.now()),
  isActive: true
})
```

**Important**: Replace `"your-secret-api-key-here"` with a secure random string. This API key will be used to authenticate as admin.

### 4. Frontend Setup

Install dependencies and build the frontend:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# For development (with hot reload)
npm run dev

# For production build
npm run build
```

Development server runs on `http://localhost:3000`.
Production build outputs to `src/main/resources/static/dist/`.

### 5. Access the Application

- **Production**: Open `http://localhost:8080` (serves the built Vue app)
- **Development**: Open `http://localhost:3000` (Vite dev server with hot reload)

## API Documentation

### Authentication

All write operations require authentication via API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key-here" http://localhost:8080/api/events
```

### Events Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | Public | Get all events |
| GET | `/api/events/{id}` | Public | Get event by ID |
| GET | `/api/events/character/{name}` | Public | Get events by character |
| POST | `/api/events` | Editor/Admin | Create new event |
| PUT | `/api/events/{id}` | Editor/Admin | Update event |
| DELETE | `/api/events/{id}` | Admin | Soft delete event |
| GET | `/api/events/{id}/history` | Public | Get version history |
| POST | `/api/events/{id}/revert/{version}` | Admin | Revert to version |

### Characters Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/characters` | Public | Get all characters |
| GET | `/api/characters/{id}` | Public | Get character by ID |
| GET | `/api/characters/search/{query}` | Public | Search characters |
| GET | `/api/characters/alive-at/{date}` | Public | Get characters alive at date |
| POST | `/api/characters` | Editor/Admin | Create character |
| PUT | `/api/characters/{id}` | Editor/Admin | Update character |
| DELETE | `/api/characters/{id}` | Admin | Delete character |

### Users Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me` | Any | Get current user info |
| GET | `/api/users` | Admin | Get all users |
| POST | `/api/users` | Admin | Create new user |
| PUT | `/api/users/{id}/role` | Admin | Update user role |
| DELETE | `/api/users/{id}` | Admin | Deactivate user |

### Example Event Creation

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "Luffy Leaves Dawn Island",
    "type": "Event",
    "description": "Luffy sets sail from his home village to begin his pirate adventure",
    "dateType": "Exact",
    "exactDate": 1539,
    "chapter": 1,
    "involvedCharacters": ["Monkey D. Luffy"],
    "sources": [{
      "citation": "Romance Dawn - Chapter 1",
      "chapter": 1,
      "page": 1
    }]
  }'
```

## User Roles

- **Viewer**: Can view all content but cannot make changes
- **Editor**: Can create and edit events and characters
- **Admin**: Full access including delete, revert, and user management

## Creating Additional Users

Admins can create new users via the API:

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -H "X-API-Key: admin-api-key" \
  -d '{
    "username": "editor1",
    "role": "Editor"
  }'
```

The response will include the generated API key for the new user.

## Testing

The project has a comprehensive test suite with 210+ tests covering both backend and frontend:

### Backend Tests (49 tests)
- DateCalculator utility tests
- CharacterDateCalculator utility tests
- Test data builders for all models

```bash
# Run backend unit tests
./gradlew test --tests DateCalculatorTest --tests CharacterDateCalculatorTest

# View test report
open build/reports/tests/test/index.html
```

### Frontend Tests (161 tests)
- yearDisplay utility tests (54 tests)
- Pinia store tests for all stores (107 tests)
- High coverage with Vitest and Vue Test Utils

```bash
cd frontend

# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
open coverage/index.html
```

### Coverage Targets
- Lines: 85%
- Functions: 85%
- Branches: 80%
- Statements: 85%

For detailed testing documentation, see [TESTING.md](./TESTING.md).

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

- ✅ Automated testing on every push and PR
- ✅ Backend tests with JDK 21
- ✅ Frontend tests with coverage reporting
- ✅ Build verification for both backend and frontend
- ✅ Artifact uploads (JARs, coverage reports)

See `.github/workflows/ci.yml` for the complete pipeline configuration.

## Development Workflow

### Backend Development

```bash
# Run with auto-reload
./gradlew run --continuous

# Run tests
./gradlew test

# Run specific tests
./gradlew test --tests DateCalculatorTest

# Build production JAR
./gradlew buildFatJar
```

### Frontend Development

```bash
cd frontend

# Development server with hot reload
npm run dev

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
.
├── src/main/kotlin/
│   ├── config/
│   │   └── DatabaseConfig.kt         # MongoDB configuration
│   ├── model/
│   │   ├── Event.kt                  # Event data model
│   │   ├── EventVersion.kt           # Version history model
│   │   ├── Character.kt              # Character model
│   │   ├── User.kt                   # User model
│   │   └── Source.kt                 # Source citation model
│   ├── repository/
│   │   ├── EventRepository.kt        # Event data access
│   │   ├── CharacterRepository.kt    # Character data access
│   │   └── UserRepository.kt         # User data access
│   ├── middleware/
│   │   └── AuthMiddleware.kt         # API key authentication
│   ├── routes/
│   │   ├── EventRoutes.kt            # Event API endpoints
│   │   ├── CharacterRoutes.kt        # Character API endpoints
│   │   └── UserRoutes.kt             # User API endpoints
│   ├── Application.kt                # Main application
│   ├── Routing.kt                    # Route configuration
│   └── Serialization.kt              # JSON serialization
├── frontend/
│   ├── src/
│   │   ├── components/               # Reusable Vue components
│   │   ├── views/
│   │   │   ├── TimelineView.vue      # Main timeline page
│   │   │   ├── EventDetailView.vue   # Event detail with history
│   │   │   └── EventEditView.vue     # Create/edit event form
│   │   ├── stores/
│   │   │   ├── auth.js               # Authentication state
│   │   │   ├── events.js             # Events state
│   │   │   └── characters.js         # Characters state
│   │   ├── services/
│   │   │   └── api.js                # API client
│   │   ├── router/
│   │   │   └── index.js              # Vue Router config
│   │   ├── App.vue                   # Root component
│   │   └── main.js                   # App entry point
│   ├── package.json
│   └── vite.config.js
└── build.gradle.kts
```

## License

This project is for educational and fan purposes related to One Piece.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

### MongoDB Connection Issues

If you see connection errors, ensure MongoDB is running:

```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"
```

### Frontend Build Issues

Clear node_modules and reinstall:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port Conflicts

If port 8080 or 3000 is in use, you can change them:
- Backend: Modify `src/main/resources/application.yaml`
- Frontend: Modify `frontend/vite.config.js`

