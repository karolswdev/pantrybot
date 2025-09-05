#!/bin/bash

# 🎬 Fridgr Demo Script - Quick Showcase
# =======================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

# Clear screen for fresh start
clear

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║           🥗 FRIDGR - Smart Food Inventory Demo 🥗            ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${WHITE}${BOLD}Welcome to Fridgr!${NC}"
echo -e "${YELLOW}Let's quickly showcase the MVP features...${NC}"
echo ""

# Function to wait for user
wait_for_user() {
    echo -e "${CYAN}Press Enter to continue...${NC}"
    read
}

# Function to show loading
show_loading() {
    echo -ne "${YELLOW}Loading"
    for i in {1..3}; do
        echo -ne "."
        sleep 0.5
    done
    echo -e " ${GREEN}Done!${NC}"
}

# Start the demo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}${BOLD}Step 1: Starting Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}Starting Docker containers...${NC}"
docker-compose up -d > /dev/null 2>&1
show_loading

echo -e "${GREEN}✅ Frontend running at: ${WHITE}http://localhost:3003${NC}"
echo -e "${GREEN}✅ Mock API running at: ${WHITE}http://localhost:8080${NC}"
echo ""

wait_for_user

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}${BOLD}Step 2: Feature Showcase${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${WHITE}Opening Fridgr in your browser...${NC}"
echo ""

# Feature list
features=(
    "🔐 Authentication System:JWT-based auth with refresh tokens"
    "🏠 Multi-Household Support:Manage multiple households"
    "📦 Inventory Management:Track items with expiration dates"
    "🔔 Smart Notifications:Multi-channel alerts"
    "🛒 Shopping Lists:Real-time collaborative lists"
    "📊 Analytics Dashboard:Waste tracking and insights"
    "📱 Progressive Web App:Install on any device"
    "🔄 Real-time Sync:WebSocket-powered updates"
)

for feature in "${features[@]}"; do
    IFS=':' read -r title desc <<< "$feature"
    echo -e "${GREEN}${title}${NC}"
    echo -e "  └─ ${WHITE}${desc}${NC}"
    echo ""
    sleep 1
done

wait_for_user

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}${BOLD}Step 3: Test Credentials${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${WHITE}Use these credentials to test the app:${NC}"
echo ""
echo -e "${CYAN}📧 Email:${NC}    demo@fridgr.app"
echo -e "${CYAN}🔑 Password:${NC} Demo123!"
echo ""
echo -e "${YELLOW}Or create a new account to explore!${NC}"
echo ""

wait_for_user

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}${BOLD}Step 4: API Explorer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${WHITE}Testing API endpoints...${NC}"
echo ""

# Test health endpoint
echo -e "${CYAN}Testing health endpoint...${NC}"
health_response=$(curl -s http://localhost:8080/health)
if [ ! -z "$health_response" ]; then
    echo -e "${GREEN}✅ API is healthy!${NC}"
else
    echo -e "${YELLOW}⚠️ API might still be starting...${NC}"
fi

echo ""
echo -e "${WHITE}Available API endpoints:${NC}"
echo -e "  ${CYAN}POST${NC} /api/v1/auth/register"
echo -e "  ${CYAN}POST${NC} /api/v1/auth/login"
echo -e "  ${CYAN}GET${NC}  /api/v1/households"
echo -e "  ${CYAN}GET${NC}  /api/v1/households/{id}/items"
echo -e "  ${CYAN}POST${NC} /api/v1/households/{id}/items"
echo -e "  ${CYAN}GET${NC}  /api/v1/shopping-lists"
echo -e "  ${CYAN}GET${NC}  /api/v1/households/{id}/statistics"
echo ""

wait_for_user

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}${BOLD}Step 5: Run Tests (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${WHITE}Would you like to run the test suite? (y/n)${NC}"
read -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}Running test suite...${NC}"
    ./scripts/test-runner.sh
else
    echo -e "${YELLOW}Skipping tests...${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}${BOLD}Demo Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}${BOLD}🎉 Fridgr MVP is ready for exploration!${NC}"
echo ""
echo -e "${WHITE}Quick Links:${NC}"
echo -e "  🌐 Frontend: ${CYAN}http://localhost:3003${NC}"
echo -e "  🔌 API:      ${CYAN}http://localhost:8080${NC}"
echo -e "  📚 Docs:     ${CYAN}See .pm/ directory${NC}"
echo ""

echo -e "${YELLOW}To stop the services, run:${NC} ${WHITE}docker-compose down${NC}"
echo ""

echo -e "${CYAN}${BOLD}Thank you for trying Fridgr!${NC}"
echo -e "${WHITE}Built with ❤️ to reduce food waste${NC}"
echo ""

# Open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3003
elif command -v open > /dev/null; then
    open http://localhost:3003
fi