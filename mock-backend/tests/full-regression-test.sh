#!/bin/bash

# PHASE-MBE-3 Final Acceptance Gate - Full Regression Test
# This script executes all 19 test cases from Phases 1, 2, and 3

API_BASE="http://localhost:8080/api/v1"
EVIDENCE_PATH="../evidence/PHASE-MBE-3"
LOG_FILE="$EVIDENCE_PATH/phase-regression-test.log"

# Ensure evidence directory exists
mkdir -p "$EVIDENCE_PATH"

# Initialize log file
echo "==================================================================" > "$LOG_FILE"
echo "PHASE-MBE-3 Final Acceptance Gate - Full Regression Test" >> "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
echo "==================================================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

PASSED=0
FAILED=0

# Helper function to test endpoints
test_endpoint() {
    local test_id=$1
    local description=$2
    local command=$3
    local expected_status=$4
    
    echo "Running $test_id: $description" | tee -a "$LOG_FILE"
    echo "Command: $command" >> "$LOG_FILE"
    
    # Execute command and capture response
    response=$(eval "$command" 2>&1)
    status_code=$(echo "$response" | grep -o "HTTP/[0-9.]* [0-9]*" | tail -1 | awk '{print $2}')
    
    echo "Response:" >> "$LOG_FILE"
    echo "$response" >> "$LOG_FILE"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✓ $test_id PASSED (Expected: $expected_status, Got: $status_code)" | tee -a "$LOG_FILE"
        ((PASSED++))
    else
        echo "✗ $test_id FAILED (Expected: $expected_status, Got: $status_code)" | tee -a "$LOG_FILE"
        ((FAILED++))
    fi
    echo "---" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

echo "Starting Full Regression Test Suite..." | tee -a "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Phase 1 Tests (TC-MBE-1.1 through TC-MBE-1.7)
echo "=== PHASE 1 TESTS ===" | tee -a "$LOG_FILE"

# TC-MBE-1.1: Register without payload returns 400
test_endpoint "TC-MBE-1.1" \
    "Register without payload returns 400" \
    "curl -iS -X POST $API_BASE/auth/register -H 'Content-Type: application/json'" \
    "400"

# TC-MBE-1.2: Register with invalid email returns 400
test_endpoint "TC-MBE-1.2" \
    "Register with invalid email returns 400" \
    "curl -iS -X POST $API_BASE/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"invalid-email\",\"password\":\"Test123!\",\"confirmPassword\":\"Test123!\",\"displayName\":\"Test User\"}'" \
    "400"

# TC-MBE-1.3: Register with valid data returns 201
test_endpoint "TC-MBE-1.3" \
    "Register with valid data returns 201" \
    "curl -iS -X POST $API_BASE/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test$(date +%s)@example.com\",\"password\":\"Test123!\",\"confirmPassword\":\"Test123!\",\"displayName\":\"Test User\"}'" \
    "201"

# TC-MBE-1.4: Register duplicate email returns 409
# First register a user
curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"duplicate@example.com","password":"Test123!","confirmPassword":"Test123!","displayName":"Test User"}' > /dev/null 2>&1

test_endpoint "TC-MBE-1.4" \
    "Register duplicate email returns 409" \
    "curl -iS -X POST $API_BASE/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"duplicate@example.com\",\"password\":\"Test123!\",\"confirmPassword\":\"Test123!\",\"displayName\":\"Test User\"}'" \
    "409"

# TC-MBE-1.5: Login with invalid credentials returns 401
test_endpoint "TC-MBE-1.5" \
    "Login with invalid credentials returns 401" \
    "curl -iS -X POST $API_BASE/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"wrong@example.com\",\"password\":\"WrongPass123!\"}'" \
    "401"

# TC-MBE-1.6: Login with valid credentials returns 200
# First register a user
email="testlogin$(date +%s)@example.com"
curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"Test123!\",\"confirmPassword\":\"Test123!\",\"displayName\":\"Test User\"}" > /dev/null 2>&1

test_endpoint "TC-MBE-1.6" \
    "Login with valid credentials returns 200" \
    "curl -iS -X POST $API_BASE/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"$email\",\"password\":\"Test123!\"}'" \
    "200"

# TC-MBE-1.7: Refresh with valid token returns 200
# Get tokens from login
login_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"Test123!\"}")
refresh_token=$(echo "$login_response" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

test_endpoint "TC-MBE-1.7" \
    "Refresh with valid token returns 200" \
    "curl -iS -X POST $API_BASE/auth/refresh -H 'Content-Type: application/json' -d '{\"refreshToken\":\"$refresh_token\"}'" \
    "200"

# Phase 2 Tests (TC-MBE-2.1 through TC-MBE-2.4)
echo "" >> "$LOG_FILE"
echo "=== PHASE 2 TESTS ===" | tee -a "$LOG_FILE"

# Get auth token for protected endpoints
email2="testuser$(date +%s)@example.com"
curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email2\",\"password\":\"Test123!\",\"confirmPassword\":\"Test123!\",\"displayName\":\"Test User\"}" > /dev/null 2>&1

login_resp=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email2\",\"password\":\"Test123!\"}")
access_token=$(echo "$login_resp" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
user_id=$(echo "$login_resp" | grep -o '"userId":"[^"]*' | cut -d'"' -f4)

# TC-MBE-2.1: Access households without token returns 401
test_endpoint "TC-MBE-2.1" \
    "Access households without token returns 401" \
    "curl -iS -X GET $API_BASE/households" \
    "401"

# TC-MBE-2.2: Create household with valid token returns 201
test_endpoint "TC-MBE-2.2" \
    "Create household with valid token returns 201" \
    "curl -iS -X POST $API_BASE/households -H 'Authorization: Bearer $access_token' -H 'Content-Type: application/json' -d '{\"name\":\"Test Household\",\"description\":\"Test Description\"}'" \
    "201"

# TC-MBE-2.3: Get households with valid token returns 200
test_endpoint "TC-MBE-2.3" \
    "Get households with valid token returns 200" \
    "curl -iS -X GET $API_BASE/households -H 'Authorization: Bearer $access_token'" \
    "200"

# TC-MBE-2.4: Get dashboard stats with valid token returns 200
test_endpoint "TC-MBE-2.4" \
    "Get dashboard stats with valid token returns 200" \
    "curl -iS -X GET $API_BASE/dashboard/stats -H 'Authorization: Bearer $access_token'" \
    "200"

# Phase 3 Tests (TC-MBE-3.1 through TC-MBE-3.8)
echo "" >> "$LOG_FILE"
echo "=== PHASE 3 TESTS ===" | tee -a "$LOG_FILE"

# Create a household for inventory tests
household_resp=$(curl -s -X POST "$API_BASE/households" \
    -H "Authorization: Bearer $access_token" \
    -H "Content-Type: application/json" \
    -d '{"name":"Inventory Test House","description":"For testing"}')
household_id=$(echo "$household_resp" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# TC-MBE-3.1: Access inventory without token returns 401
test_endpoint "TC-MBE-3.1" \
    "Access inventory without token returns 401" \
    "curl -iS -X GET $API_BASE/households/$household_id/items" \
    "401"

# TC-MBE-3.2: List items with valid token returns 200
test_endpoint "TC-MBE-3.2" \
    "List items with valid token returns 200" \
    "curl -iS -X GET $API_BASE/households/$household_id/items -H 'Authorization: Bearer $access_token'" \
    "200"

# TC-MBE-3.3: Add item with valid data returns 201
test_endpoint "TC-MBE-3.3" \
    "Add item with valid data returns 201" \
    "curl -iS -X POST $API_BASE/households/$household_id/items -H 'Authorization: Bearer $access_token' -H 'Content-Type: application/json' -d '{\"name\":\"Milk\",\"quantity\":2,\"unit\":\"liters\",\"expirationDate\":\"2024-12-31\",\"location\":\"Fridge\"}'" \
    "201"

# Get an item for update/delete tests
items_resp=$(curl -s -X GET "$API_BASE/households/$household_id/items" \
    -H "Authorization: Bearer $access_token")
item_id=$(echo "$items_resp" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

# Get item with ETag for update tests
item_resp=$(curl -sI -X GET "$API_BASE/households/$household_id/items/$item_id" \
    -H "Authorization: Bearer $access_token")
etag=$(echo "$item_resp" | grep -i "etag:" | sed 's/.*etag: *//i' | tr -d '\r\n' | sed 's/W\///')

# TC-MBE-3.4: Update item with correct ETag returns 200
test_endpoint "TC-MBE-3.4" \
    "Update item with correct ETag returns 200" \
    "curl -iS -X PATCH $API_BASE/households/$household_id/items/$item_id -H 'Authorization: Bearer $access_token' -H 'Content-Type: application/json' -H 'If-Match: W/\"1\"' -d '{\"quantity\":3}'" \
    "200"

# TC-MBE-3.5: Update item with stale ETag returns 409
test_endpoint "TC-MBE-3.5" \
    "Update item with stale ETag returns 409" \
    "curl -iS -X PATCH $API_BASE/households/$household_id/items/$item_id -H 'Authorization: Bearer $access_token' -H 'Content-Type: application/json' -H 'If-Match: W/\"999\"' -d '{\"quantity\":4}'" \
    "409"

# TC-MBE-3.6: Consume item with valid quantity returns 200
test_endpoint "TC-MBE-3.6" \
    "Consume item with valid quantity returns 200" \
    "curl -iS -X POST $API_BASE/households/$household_id/items/$item_id/consume -H 'Authorization: Bearer $access_token' -H 'Content-Type: application/json' -d '{\"quantity\":1}'" \
    "200"

# TC-MBE-3.7: Waste item with valid quantity and reason returns 200
test_endpoint "TC-MBE-3.7" \
    "Waste item with valid quantity and reason returns 200" \
    "curl -iS -X POST $API_BASE/households/$household_id/items/$item_id/waste -H 'Authorization: Bearer $access_token' -H 'Content-Type: application/json' -d '{\"quantity\":1,\"reason\":\"Expired\"}'" \
    "200"

# TC-MBE-3.8: Delete item with valid id returns 204
test_endpoint "TC-MBE-3.8" \
    "Delete item with valid id returns 204" \
    "curl -iS -X DELETE $API_BASE/households/$household_id/items/$item_id -H 'Authorization: Bearer $access_token'" \
    "204"

# Summary
echo "" >> "$LOG_FILE"
echo "==================================================================" | tee -a "$LOG_FILE"
echo "FINAL REGRESSION TEST SUMMARY" | tee -a "$LOG_FILE"
echo "==================================================================" | tee -a "$LOG_FILE"
echo "Total Test Cases: $((PASSED + FAILED))" | tee -a "$LOG_FILE"
echo "Passed: $PASSED" | tee -a "$LOG_FILE"
echo "Failed: $FAILED" | tee -a "$LOG_FILE"
echo "" >> "$LOG_FILE"

if [ $FAILED -eq 0 ]; then
    echo "✓ ALL TESTS PASSED - PHASE-MBE-3 FINAL ACCEPTANCE GATE COMPLETE" | tee -a "$LOG_FILE"
    exit 0
else
    echo "✗ TESTS FAILED - PHASE-MBE-3 FINAL ACCEPTANCE GATE NOT MET" | tee -a "$LOG_FILE"
    exit 1
fi