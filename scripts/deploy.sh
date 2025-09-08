#!/bin/bash

# Fridgr Manual Deployment Script for Staging VPS
# This script is intended to be executed manually on the staging VPS
# It handles Docker registry login, image pulling, and service restart

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if running on the VPS
check_environment() {
    print_message "$YELLOW" "🚀 Starting Fridgr Staging Deployment..."
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_message "$RED" "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_message "$RED" "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if required compose files exist
    if [ ! -f "docker-compose.yml" ] || [ ! -f "docker-compose.staging.yml" ]; then
        print_message "$RED" "❌ Required docker-compose files not found. Please ensure you're in the project root directory."
        exit 1
    fi
}

# Function to login to GitHub Container Registry
login_to_registry() {
    print_message "$YELLOW" "📦 Logging into GitHub Container Registry (ghcr.io)..."
    
    # Prompt for GitHub Personal Access Token
    echo -n "Please enter your GitHub Personal Access Token (with 'read:packages' permission): "
    read -s GITHUB_TOKEN
    echo ""
    
    # Attempt login
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
    
    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✅ Successfully logged into ghcr.io"
    else
        print_message "$RED" "❌ Failed to login to ghcr.io. Please check your token and try again."
        exit 1
    fi
}

# Function to pull latest Docker images
pull_images() {
    print_message "$YELLOW" "📥 Pulling latest Docker images..."
    
    # Pull images using both compose files
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml pull
    
    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✅ Successfully pulled latest images"
    else
        print_message "$RED" "❌ Failed to pull images. Please check your connection and registry access."
        exit 1
    fi
}

# Function to restart services
restart_services() {
    print_message "$YELLOW" "🔄 Restarting services..."
    
    # Stop existing containers
    print_message "$YELLOW" "   Stopping existing containers..."
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml down
    
    # Start services with new images
    print_message "$YELLOW" "   Starting services with updated images..."
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
    
    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✅ Services restarted successfully"
        
        # Show running containers
        print_message "$YELLOW" "📊 Running containers:"
        docker-compose -f docker-compose.yml -f docker-compose.staging.yml ps
    else
        print_message "$RED" "❌ Failed to restart services. Please check the logs."
        exit 1
    fi
}

# Function to prune old Docker images
prune_images() {
    print_message "$YELLOW" "🧹 Pruning old Docker images..."
    
    # Remove unused images (dangling images)
    docker image prune -f
    
    # Optionally remove all unused images (not just dangling)
    # Prompt user for confirmation
    echo -n "Do you want to remove ALL unused images (not just dangling)? This will free more space. (y/N): "
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        docker image prune -a -f
        print_message "$GREEN" "✅ All unused images have been removed"
    else
        print_message "$GREEN" "✅ Only dangling images have been removed"
    fi
}

# Function to verify deployment
verify_deployment() {
    print_message "$YELLOW" "🔍 Verifying deployment..."
    
    # Wait a few seconds for services to fully start
    sleep 5
    
    # Check if containers are running
    local frontend_status=$(docker-compose -f docker-compose.yml -f docker-compose.staging.yml ps -q frontend)
    local backend_status=$(docker-compose -f docker-compose.yml -f docker-compose.staging.yml ps -q mock-backend)
    
    if [ -n "$frontend_status" ] && [ -n "$backend_status" ]; then
        print_message "$GREEN" "✅ All required services are running"
        
        # Test health endpoints if accessible locally
        print_message "$YELLOW" "Testing service health endpoints..."
        
        # Test mock-backend health
        if curl -s -f http://localhost:8088/health > /dev/null 2>&1; then
            print_message "$GREEN" "   ✅ Mock backend is healthy"
        else
            print_message "$YELLOW" "   ⚠️  Mock backend health check failed (might be normal if Nginx is required)"
        fi
        
        # Test frontend
        if curl -s -f http://localhost:3010 > /dev/null 2>&1; then
            print_message "$GREEN" "   ✅ Frontend is accessible"
        else
            print_message "$YELLOW" "   ⚠️  Frontend not directly accessible (might be normal if Nginx is required)"
        fi
    else
        print_message "$RED" "❌ Some services failed to start. Please check the logs:"
        echo "   Run: docker-compose -f docker-compose.yml -f docker-compose.staging.yml logs"
        exit 1
    fi
}

# Main deployment flow
main() {
    print_message "$GREEN" "==========================================="
    print_message "$GREEN" "   Fridgr Staging Deployment Script"
    print_message "$GREEN" "==========================================="
    echo ""
    
    # Step 1: Check environment
    check_environment
    
    # Step 2: Login to registry
    login_to_registry
    
    # Step 3: Pull latest images
    pull_images
    
    # Step 4: Restart services
    restart_services
    
    # Step 5: Prune old images
    prune_images
    
    # Step 6: Verify deployment
    verify_deployment
    
    print_message "$GREEN" ""
    print_message "$GREEN" "==========================================="
    print_message "$GREEN" "🎉 Deployment completed successfully!"
    print_message "$GREEN" "==========================================="
    print_message "$YELLOW" ""
    print_message "$YELLOW" "Next steps:"
    print_message "$YELLOW" "1. Ensure Nginx is configured and running"
    print_message "$YELLOW" "2. Verify the application at https://pantrybot.app"
    print_message "$YELLOW" "3. Check API health at https://api.pantrybot.app/health"
    echo ""
}

# Run the main function
main "$@"