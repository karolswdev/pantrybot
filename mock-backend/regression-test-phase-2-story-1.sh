#!/bin/bash

# Regression Test Script for PHASE-MBE-2 STORY-MBE-2.1
# Tests all 11 test cases from Phase 1 and Story MBE-2.1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:8080"

# Test result tracking
PASSED=0
FAILED=0
TOTAL=11

echo "========================================="
echo "REGRESSION TEST - PHASE-MBE-2 STORY-MBE-2.1"
echo "Running all 11 test cases"
echo "========================================="
echo ""

# Helper function to check test result
check_result() {
    local test_id=$1
    local expected_status=$2
    local actual_status=$3
    
    if [ "$actual_status" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $test_id: PASSED (HTTP $actual_status)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $test_id: FAILED (Expected $expected_status, Got $actual_status)"
        ((FAILED++))
    fi
}

# TC-MBE-1.1: Health check
echo "TC-MBE-1.1: Testing health endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
check_result "TC-MBE-1.1" "200" "$STATUS"

# TC-MBE-1.2: Register with invalid email
echo "TC-MBE-1.2: Testing registration with invalid email..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid-email","password":"Password123!","displayName":"Test"}')
check_result "TC-MBE-1.2" "400" "$STATUS"

# TC-MBE-1.3: Register with weak password
echo "TC-MBE-1.3: Testing registration with weak password..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test2@example.com","password":"weak","displayName":"Test"}')
check_result "TC-MBE-1.3" "400" "$STATUS"

# TC-MBE-1.4: Successful registration
echo "TC-MBE-1.4: Testing successful registration..."
TIMESTAMP=$(date +%s)
EMAIL="test_$TIMESTAMP@example.com"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"Password123!\",\"displayName\":\"Test User\"}")
STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
check_result "TC-MBE-1.4" "201" "$STATUS"

# TC-MBE-1.5: Duplicate email registration
echo "TC-MBE-1.5: Testing duplicate email registration..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"Password123!\",\"displayName\":\"Test User\"}")
check_result "TC-MBE-1.5" "409" "$STATUS"

# TC-MBE-1.6: Login with invalid credentials
echo "TC-MBE-1.6: Testing login with invalid credentials..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@example.com","password":"WrongPass123!"}')
check_result "TC-MBE-1.6" "401" "$STATUS"

# TC-MBE-1.7: Successful login
echo "TC-MBE-1.7: Testing successful login..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"Password123!\"}")
STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
check_result "TC-MBE-1.7" "200" "$STATUS"

# Extract tokens for subsequent tests
ACCESS_TOKEN=$(echo "$RESPONSE" | head -n -1 | python3 -c "import json, sys; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
REFRESH_TOKEN=$(echo "$RESPONSE" | head -n -1 | python3 -c "import json, sys; print(json.load(sys.stdin)['refreshToken'])" 2>/dev/null)

# TC-MBE-2.1: Access protected endpoint without token
echo "TC-MBE-2.1: Testing protected endpoint without token..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/households")
check_result "TC-MBE-2.1" "401" "$STATUS"

# TC-MBE-2.2: List households with valid token
echo "TC-MBE-2.2: Testing list households with valid token..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/households" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
check_result "TC-MBE-2.2" "200" "$STATUS"

# TC-MBE-2.3: Create household with valid data
echo "TC-MBE-2.3: Testing create household..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/v1/households" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Household","description":"Test","timezone":"UTC"}')
STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
check_result "TC-MBE-2.3" "201" "$STATUS"

# Extract household ID for next test
HOUSEHOLD_ID=$(echo "$RESPONSE" | head -n -1 | python3 -c "import json, sys; print(json.load(sys.stdin)['id'])" 2>/dev/null)

# TC-MBE-2.4: Get household details
echo "TC-MBE-2.4: Testing get household details..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/households/$HOUSEHOLD_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
check_result "TC-MBE-2.4" "200" "$STATUS"

# Summary
echo ""
echo "========================================="
echo "REGRESSION TEST SUMMARY"
echo "========================================="
echo -e "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "\n${RED}SOME TESTS FAILED!${NC}"
    exit 1
fi