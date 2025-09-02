#!/bin/bash

# Full Regression Test for STORY-MBE-3.1
# Tests all 14 test cases from Phases 1, 2, and current story

echo "=== FULL REGRESSION TEST FOR STORY-MBE-3.1 ==="
echo "Date: $(date)"
echo "Testing all 14 test cases from Phases 1, 2, and Story MBE-3.1"
echo ""

# Test counters
PASSED=0
FAILED=0

# Function to run a test and check result
run_test() {
    local test_name=$1
    local test_command=$2
    local expected_status=$3
    
    echo "Testing $test_name..."
    status_code=$(eval "$test_command")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✓ $test_name PASSED (got $status_code)"
        ((PASSED++))
    else
        echo "✗ $test_name FAILED (expected $expected_status, got $status_code)"
        ((FAILED++))
    fi
    echo ""
}

# Phase 1 Tests (TC-MBE-1.1 to TC-MBE-1.7)
echo "=== PHASE 1 TESTS (Authentication) ==="

# TC-MBE-1.1: Health check
run_test "TC-MBE-1.1 (Health Check)" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/health" \
    "200"

# TC-MBE-1.2: Register with invalid email
run_test "TC-MBE-1.2 (Invalid Email)" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8080/api/v1/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"notanemail\",\"password\":\"Pass123!\",\"displayName\":\"Test\"}'" \
    "400"

# TC-MBE-1.3: Register with valid data
TEST_EMAIL="regtest$(date +%s)@example.com"
run_test "TC-MBE-1.3 (Valid Registration)" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8080/api/v1/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"SecurePass123!\",\"displayName\":\"Test User\",\"timezone\":\"UTC\"}'" \
    "201"

# TC-MBE-1.4: Login with valid credentials (register first)
LOGIN_EMAIL="logintest$(date +%s)@example.com"
curl -s -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" \
    -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"SecurePass123!\",\"displayName\":\"Login Test\",\"timezone\":\"UTC\"}" > /dev/null 2>&1

run_test "TC-MBE-1.4 (Valid Login)" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"$LOGIN_EMAIL\",\"password\":\"SecurePass123!\"}'" \
    "200"

# TC-MBE-1.5: Invalid login
run_test "TC-MBE-1.5 (Invalid Login)" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"nonexistent@example.com\",\"password\":\"Wrong123!\"}'" \
    "401"

# TC-MBE-1.6: Token refresh
REFRESH_EMAIL="refresh$(date +%s)@example.com"
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$REFRESH_EMAIL\",\"password\":\"SecurePass123!\",\"displayName\":\"Refresh Test\",\"timezone\":\"UTC\"}")
REFRESH_TOKEN=$(echo $REFRESH_RESPONSE | jq -r .refreshToken)

run_test "TC-MBE-1.6 (Token Refresh)" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8080/api/v1/auth/refresh -H 'Content-Type: application/json' -d '{\"refreshToken\":\"$REFRESH_TOKEN\"}'" \
    "200"

# TC-MBE-1.7: Duplicate registration
run_test "TC-MBE-1.7 (Duplicate Registration)" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8080/api/v1/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"$LOGIN_EMAIL\",\"password\":\"SecurePass123!\",\"displayName\":\"Duplicate\",\"timezone\":\"UTC\"}'" \
    "409"

echo ""
echo "=== PHASE 2 TESTS (Household Management) ==="

# Setup for Phase 2 tests
PHASE2_EMAIL="phase2test$(date +%s)@example.com"
PHASE2_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$PHASE2_EMAIL\",\"password\":\"SecurePass123!\",\"displayName\":\"Phase2 Test\",\"timezone\":\"UTC\"}")
ACCESS_TOKEN=$(echo $PHASE2_RESPONSE | jq -r .accessToken)

# TC-MBE-2.1: Access protected endpoint without token
run_test "TC-MBE-2.1 (No Token)" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET http://localhost:8080/api/v1/households" \
    "401"

# TC-MBE-2.2: List households with valid token
run_test "TC-MBE-2.2 (List Households)" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET http://localhost:8080/api/v1/households -H 'Authorization: Bearer $ACCESS_TOKEN'" \
    "200"

# TC-MBE-2.3: Create household
run_test "TC-MBE-2.3 (Create Household)" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8080/api/v1/households -H 'Authorization: Bearer $ACCESS_TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Test Household\",\"description\":\"Test\"}'" \
    "201"

# TC-MBE-2.4: Get household details
HOUSEHOLD_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/households \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Detail Test House","description":"For testing"}')
HOUSEHOLD_ID=$(echo $HOUSEHOLD_RESPONSE | jq -r .id)

run_test "TC-MBE-2.4 (Get Household Details)" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET http://localhost:8080/api/v1/households/$HOUSEHOLD_ID -H 'Authorization: Bearer $ACCESS_TOKEN'" \
    "200"

echo ""
echo "=== STORY MBE-3.1 TESTS (Inventory Management) ==="

# TC-MBE-3.1: Access inventory without token
run_test "TC-MBE-3.1 (Inventory No Token)" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET http://localhost:8080/api/v1/households/$HOUSEHOLD_ID/items" \
    "401"

# TC-MBE-3.2: List items with valid token
run_test "TC-MBE-3.2 (List Items)" \
    "curl -s -o /dev/null -w '%{http_code}' -X GET http://localhost:8080/api/v1/households/$HOUSEHOLD_ID/items -H 'Authorization: Bearer $ACCESS_TOKEN'" \
    "200"

# TC-MBE-3.3: Add item with valid data
run_test "TC-MBE-3.3 (Add Item)" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8080/api/v1/households/$HOUSEHOLD_ID/items -H 'Authorization: Bearer $ACCESS_TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Test Item\",\"quantity\":1,\"unit\":\"piece\"}'" \
    "201"

echo ""
echo "=== REGRESSION TEST SUMMARY ==="
echo "Total Tests: $((PASSED + FAILED))"
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
    echo "Result: ALL TESTS PASSED ✓"
    exit 0
else
    echo "Result: SOME TESTS FAILED ✗"
    exit 1
fi