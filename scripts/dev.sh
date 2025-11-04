#!/bin/bash
# One Piece Timeline - Development Server Script
# Starts all development servers (MongoDB, Backend, Frontend)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}→${NC} $1"
}

print_header() {
    echo -e "${YELLOW}$1${NC}"
}

# Cleanup function to stop all services
cleanup() {
    echo ""
    print_header "=========================================="
    print_header "Shutting down development environment..."
    print_header "=========================================="
    echo ""

    if [ -n "$BACKEND_PID" ]; then
        print_info "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PID" ]; then
        print_info "Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # Note: We don't stop MongoDB as it runs in Docker Compose
    # Users can stop it manually with: docker-compose down

    echo ""
    print_success "Development servers stopped"
    print_info "MongoDB is still running in Docker"
    print_info "Stop it with: ${YELLOW}docker-compose down${NC}"
    echo ""
    exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup EXIT INT TERM

echo ""
print_header "=========================================="
print_header "One Piece Timeline - Development Mode"
print_header "=========================================="
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running"
    echo "  Please start Docker and try again"
    exit 1
fi

# Check if MongoDB is already running
print_info "Checking MongoDB status..."
if docker-compose ps mongodb | grep -q "Up"; then
    print_success "MongoDB is already running"
else
    print_info "Starting MongoDB..."
    docker-compose up -d mongodb

    print_info "Waiting for MongoDB to be ready..."
    sleep 5

    # Wait for healthy status
    for i in {1..30}; do
        if docker-compose ps mongodb | grep -q "healthy"; then
            print_success "MongoDB is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "MongoDB failed to start"
            exit 1
        fi
        sleep 1
    done
fi

echo ""
print_header "Starting backend server..."
echo ""

# Start backend in background
print_info "Running: ./gradlew run --continuous"
MONGODB_URI="mongodb://localhost:27017" ./gradlew run --continuous > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Create logs directory if it doesn't exist
mkdir -p logs

print_success "Backend starting... (PID: $BACKEND_PID)"
print_info "Logs: logs/backend.log"

# Wait a bit for backend to start
sleep 5

echo ""
print_header "Starting frontend dev server..."
echo ""

# Start frontend in background
print_info "Running: npm run dev (in frontend/)"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

print_success "Frontend starting... (PID: $FRONTEND_PID)"
print_info "Logs: logs/frontend.log"

# Wait a bit for frontend to start
sleep 5

echo ""
print_header "=========================================="
print_header "Development Environment Ready! 🎉"
print_header "=========================================="
echo ""
print_success "All services are running:"
echo ""
echo "  ${GREEN}Frontend:${NC}  ${YELLOW}http://localhost:3000${NC}"
echo "             Hot reload enabled"
echo ""
echo "  ${GREEN}Backend:${NC}   ${YELLOW}http://localhost:8080${NC}"
echo "             Auto-recompile on file changes"
echo ""
echo "  ${GREEN}MongoDB:${NC}   ${YELLOW}mongodb://localhost:27017${NC}"
echo "             Database: one_piece_timeline"
echo ""
print_header "=========================================="
echo ""
echo "${GREEN}Development API Keys:${NC}"
echo "  Admin:  ${YELLOW}dev-admin-key-CHANGE-IN-PRODUCTION${NC} (full access)"
echo "  Editor: ${YELLOW}dev-editor-key-CHANGE-IN-PRODUCTION${NC} (create/edit)"
echo "  Viewer: ${YELLOW}dev-viewer-key-CHANGE-IN-PRODUCTION${NC} (read-only)"
echo ""
echo "${GREEN}Useful commands:${NC}"
echo "  View backend logs:  ${YELLOW}tail -f logs/backend.log${NC}"
echo "  View frontend logs: ${YELLOW}tail -f logs/frontend.log${NC}"
echo "  View MongoDB logs:  ${YELLOW}docker-compose logs -f mongodb${NC}"
echo "  Reset database:     ${YELLOW}./scripts/reset-db.sh${NC}"
echo ""
echo "${BLUE}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running and wait for user to stop
wait
