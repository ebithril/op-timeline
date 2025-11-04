#!/bin/bash
# One Piece Timeline - One-time Setup Script
# This script sets up your local development environment

set -e  # Exit on error

echo "=========================================="
echo "One Piece Timeline - Development Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_info() {
    echo -e "${BLUE}→${NC} $1"
}

echo "Step 1: Checking prerequisites..."
echo ""

# Check Java
if command_exists java; then
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -ge 21 ]; then
        print_success "Java $JAVA_VERSION found"
    else
        print_error "Java 21 or higher required (found Java $JAVA_VERSION)"
        echo "  Please install Java 21: https://adoptium.net/"
        exit 1
    fi
else
    print_error "Java not found"
    echo "  Please install Java 21: https://adoptium.net/"
    exit 1
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        print_success "Node.js $(node --version) found"
    else
        print_error "Node.js 18 or higher required (found Node.js v$NODE_VERSION)"
        echo "  Please install Node.js 18+: https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js not found"
    echo "  Please install Node.js 18+: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    print_success "npm $(npm --version) found"
else
    print_error "npm not found (should come with Node.js)"
    exit 1
fi

# Check Docker
if command_exists docker; then
    print_success "Docker found"

    # Check if Docker daemon is running
    if docker info >/dev/null 2>&1; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        echo "  Please start Docker and try again"
        exit 1
    fi
else
    print_error "Docker not found"
    echo "  Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    print_success "Docker Compose found"
else
    print_error "Docker Compose not found"
    echo "  Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo ""
echo "Step 2: Setting up environment configuration..."
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating .env file from .env.example..."
    cp .env.example .env
    print_success ".env file created"
else
    print_warning ".env file already exists (skipping)"
fi

# Create frontend .env file if it doesn't exist
if [ ! -f frontend/.env ]; then
    print_info "Creating frontend/.env file..."
    cp frontend/.env.example frontend/.env
    print_success "frontend/.env file created"
else
    print_warning "frontend/.env file already exists (skipping)"
fi

echo ""
echo "Step 3: Installing frontend dependencies..."
echo ""

cd frontend
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo ""
echo "Step 4: Starting MongoDB with Docker Compose..."
echo ""

# Stop any existing containers
docker-compose down >/dev/null 2>&1 || true

# Start MongoDB
print_info "Starting MongoDB container..."
if docker-compose up -d mongodb; then
    print_success "MongoDB container started"
else
    print_error "Failed to start MongoDB"
    exit 1
fi

# Wait for MongoDB to be ready
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

echo ""
echo "=========================================="
echo "Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "Your development environment is ready!"
echo ""
echo "${GREEN}Next steps:${NC}"
echo "1. Run ${YELLOW}./scripts/dev.sh${NC} to start the development servers"
echo "2. Open ${YELLOW}http://localhost:3000${NC} in your browser"
echo ""
echo "${GREEN}Development API Keys:${NC}"
echo "  Admin:  ${YELLOW}dev-admin-key-CHANGE-IN-PRODUCTION${NC}"
echo "  Editor: ${YELLOW}dev-editor-key-CHANGE-IN-PRODUCTION${NC}"
echo "  Viewer: ${YELLOW}dev-viewer-key-CHANGE-IN-PRODUCTION${NC}"
echo ""
echo "${GREEN}Useful commands:${NC}"
echo "  ${YELLOW}./scripts/dev.sh${NC}      - Start all dev servers"
echo "  ${YELLOW}./scripts/reset-db.sh${NC} - Reset database to initial state"
echo "  ${YELLOW}docker-compose logs -f${NC} - View MongoDB logs"
echo ""
echo "${RED}WARNING:${NC} The API keys above are for development only!"
echo "Never use them in production!"
echo ""
