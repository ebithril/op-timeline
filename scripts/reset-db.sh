#!/bin/bash
# One Piece Timeline - Database Reset Script
# Drops the database and reinitializes it with fresh sample data

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
    echo -e "${NC}→${NC} $1"
}

echo ""
echo "=========================================="
echo "One Piece Timeline - Database Reset"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running"
    echo "  Please start Docker and try again"
    exit 1
fi

# Check if MongoDB container is running
if ! docker-compose ps mongodb | grep -q "Up"; then
    print_error "MongoDB container is not running"
    echo "  Start it with: docker-compose up -d mongodb"
    exit 1
fi

# Confirm with user
print_warning "This will DELETE ALL data in the database!"
echo "  The database will be reset to the initial sample data."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [[ ! "$confirm" =~ ^[yY]([eE][sS])?$ ]]; then
    echo ""
    print_info "Database reset cancelled"
    exit 0
fi

echo ""
print_info "Dropping existing database..."

# Drop the database
docker-compose exec -T mongodb mongosh one_piece_timeline --eval "db.dropDatabase()" > /dev/null 2>&1

print_success "Database dropped"

echo ""
print_info "Reinitializing database with sample data..."

# Run the initialization script
if docker-compose exec -T mongodb mongosh one_piece_timeline < scripts/mongo-init.js > /dev/null 2>&1; then
    print_success "Database reinitialized"
else
    print_error "Failed to reinitialize database"
    exit 1
fi

echo ""
echo "=========================================="
print_success "Database Reset Complete!"
echo "=========================================="
echo ""
echo "The database has been reset to initial state with sample data."
echo ""
echo "${GREEN}Development API Keys:${NC}"
echo "  Admin:  ${YELLOW}dev-admin-key-CHANGE-IN-PRODUCTION${NC}"
echo "  Editor: ${YELLOW}dev-editor-key-CHANGE-IN-PRODUCTION${NC}"
echo "  Viewer: ${YELLOW}dev-viewer-key-CHANGE-IN-PRODUCTION${NC}"
echo ""
echo "You can now continue development with fresh data!"
echo ""
