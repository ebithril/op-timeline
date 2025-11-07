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

## 🚀 Quick Start (Recommended)

The fastest way to get started with local development:

```bash
# 1. One-time setup (installs dependencies, starts MongoDB, seeds data)
./scripts/setup.sh

# 2. Start development servers (backend + frontend + MongoDB)
./scripts/dev.sh
```

**That's it!** Open http://localhost:3000 and start developing.

**Development API Keys** (auto-created):
- **Admin**: `dev-admin-key-CHANGE-IN-PRODUCTION` (full access)
- **Editor**: `dev-editor-key-CHANGE-IN-PRODUCTION` (create/edit)
- **Viewer**: `dev-viewer-key-CHANGE-IN-PRODUCTION` (read-only)

**Useful commands**:
- `./scripts/reset-db.sh` - Reset database to initial sample data
- `docker-compose down` - Stop MongoDB
- `docker-compose logs -f mongodb` - View MongoDB logs

> **Note**: This uses Docker Compose for MongoDB. For manual setup without Docker, see the [Manual Setup](#manual-setup-without-docker) section below.

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

### Quick Start (Docker Compose)
- **Docker** and **Docker Compose**
- **JDK 21** or higher
- **Node.js** 18 or higher

### Manual Setup (Without Docker)
- **JDK 21** or higher
- **MongoDB** 4.4 or higher (installed locally)
- **Node.js** 18 or higher (for frontend development)
- **Gradle** (included via wrapper)

## Manual Setup (Without Docker)

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

The API provides REST endpoints for managing events, characters, arcs, sagas, eras, locations, and users. All write operations require authentication via API key in the `X-API-Key` header.

For complete API documentation with interactive examples, visit the **Swagger UI** at http://localhost:8080/swagger once the backend is running.

The OpenAPI specification is maintained in `src/main/resources/openapi/documentation.yaml` and served via Ktor's built-in OpenAPI plugin.

## User Roles

- **Viewer**: Can view all content but cannot make changes
- **Editor**: Can create and edit events and characters
- **Admin**: Full access including delete, revert, and user management

Admins can create additional users via the API (see Swagger UI for details).

## Testing

The project has comprehensive test coverage for both backend and frontend.

### Backend Tests
```bash
./gradlew test
```

### Frontend Tests
```bash
cd frontend
npm test                # Run tests once
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report
```

For detailed testing documentation, see [TESTING.md](./TESTING.md).


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

