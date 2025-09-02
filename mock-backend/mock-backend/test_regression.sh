#!/bin/bash

BASE_URL="http://localhost:8080/api/v1"
EVIDENCE_DIR="./evidence/PHASE-MBE-3/QA/test-output"

echo "=== PHASE MBE-1 AND MBE-2 REGRESSION TESTS ===" | tee "$EVIDENCE_DIR/regression-tests.log"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" | tee -a "$EVIDENCE_DIR/regression-tests.log"
echo "" | tee -a "$EVIDENCE_DIR/regression-tests.log"

# Test results counters
PASSED=0
FAILED=0

# Phase 1 Tests
echo "--- PHASE MBE-1: Authentication Tests ---" | tee -a "$EVIDENCE_DIR/regression-tests.log"

# TC-MBE-1.1: Health check returns 200
echo "TC-MBE-1.1: Testing health check..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' "http://localhost:8080/health")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ TC-MBE-1.1 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-1.1 FAILED: Expected 200, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

# TC-MBE-1.2: User registration creates account
echo "TC-MBE-1.2: Testing user registration..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
UNIQUE_EMAIL="test-$(date +%s)@example.com"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$UNIQUE_EMAIL\", \"password\": \"Test123456\", \"displayName\": \"Test User\"}")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "201" ]; then
    echo "✓ TC-MBE-1.2 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-1.2 FAILED: Expected 201, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

# TC-MBE-1.3: Duplicate email returns 409
echo "TC-MBE-1.3: Testing duplicate email prevention..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$UNIQUE_EMAIL\", \"password\": \"Test123456\", \"displayName\": \"Test User\"}")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "409" ]; then
    echo "✓ TC-MBE-1.3 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-1.3 FAILED: Expected 409, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

# TC-MBE-1.4: User login returns valid token
echo "TC-MBE-1.4: Testing user login..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$UNIQUE_EMAIL\", \"password\": \"Test123456\"}")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
if [ "$HTTP_STATUS" = "200" ] && [ -n "$ACCESS_TOKEN" ]; then
    echo "✓ TC-MBE-1.4 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-1.4 FAILED: Expected 200 with token, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

# TC-MBE-1.5: Invalid credentials return 401
echo "TC-MBE-1.5: Testing invalid credentials..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid@example.com", "password": "WrongPassword"}')
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "401" ]; then
    echo "✓ TC-MBE-1.5 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-1.5 FAILED: Expected 401, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

# TC-MBE-1.6: Non-existent user returns 401
echo "TC-MBE-1.6: Testing non-existent user..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com", "password": "Test123456"}')
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "401" ]; then
    echo "✓ TC-MBE-1.6 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-1.6 FAILED: Expected 401, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

# TC-MBE-1.7: Refresh token rotates successfully
echo "TC-MBE-1.7: Testing refresh token..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
if [ -n "$REFRESH_TOKEN" ]; then
    RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
    NEW_ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    if [ "$HTTP_STATUS" = "200" ] && [ -n "$NEW_ACCESS_TOKEN" ]; then
        echo "✓ TC-MBE-1.7 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
        ((PASSED++))
    else
        echo "✗ TC-MBE-1.7 FAILED: Expected 200 with new token, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
        ((FAILED++))
    fi
else
    echo "✗ TC-MBE-1.7 SKIPPED: No refresh token available" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

echo "" | tee -a "$EVIDENCE_DIR/regression-tests.log"

# Phase 2 Tests
echo "--- PHASE MBE-2: Household Management Tests ---" | tee -a "$EVIDENCE_DIR/regression-tests.log"

# Get fresh token for Phase 2 tests
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$UNIQUE_EMAIL\", \"password\": \"Test123456\"}")
ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
HOUSEHOLD_ID=$(echo "$RESPONSE" | grep -o '"households":\[{"id":"[^"]*' | cut -d'"' -f6)

# TC-MBE-2.1: Access protected endpoint without token returns 401
echo "TC-MBE-2.1: Testing protected endpoint without token..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' "$BASE_URL/households")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "401" ]; then
    echo "✓ TC-MBE-2.1 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-2.1 FAILED: Expected 401, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

# TC-MBE-2.2: List households with valid token returns 200
echo "TC-MBE-2.2: Testing list households..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' "$BASE_URL/households" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ TC-MBE-2.2 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-2.2 FAILED: Expected 200, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

# TC-MBE-2.3: Create household with valid data returns 201
echo "TC-MBE-2.3: Testing create household..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/households" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Household", "timezone": "UTC"}')
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "201" ]; then
    echo "✓ TC-MBE-2.3 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-2.3 FAILED: Expected 201, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

# TC-MBE-2.4: Get dashboard stats returns 200
echo "TC-MBE-2.4: Testing dashboard stats..." | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' "$BASE_URL/dashboard/stats?householdId=$HOUSEHOLD_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ TC-MBE-2.4 PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-2.4 FAILED: Expected 200, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

echo "" | tee -a "$EVIDENCE_DIR/regression-tests.log"

# Fix TC-MBE-3.8: Create item and then delete it
echo "--- Fixing TC-MBE-3.8: Delete item test ---" | tee -a "$EVIDENCE_DIR/regression-tests.log"
RESPONSE=$(curl -s -X POST "$BASE_URL/households/$HOUSEHOLD_ID/items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Item to Delete Fixed", "quantity": 1, "location": "pantry"}')
DELETE_ITEM_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$DELETE_ITEM_ID" ]; then
    echo "Created item for deletion: $DELETE_ITEM_ID" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X DELETE "$BASE_URL/households/$HOUSEHOLD_ID/items/$DELETE_ITEM_ID" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
    if [ "$HTTP_STATUS" = "204" ]; then
        echo "✓ TC-MBE-3.8 FIXED AND PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
        echo "$RESPONSE" > "$EVIDENCE_DIR/TC-MBE-3.8-fixed.log"
        ((PASSED++))
    else
        echo "✗ TC-MBE-3.8 FAILED: Expected 204, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/regression-tests.log"
        ((FAILED++))
    fi
else
    echo "✗ TC-MBE-3.8 FAILED: Could not create item for deletion" | tee -a "$EVIDENCE_DIR/regression-tests.log"
    ((FAILED++))
fi

echo "" | tee -a "$EVIDENCE_DIR/regression-tests.log"
echo "=== REGRESSION TEST SUMMARY ===" | tee -a "$EVIDENCE_DIR/regression-tests.log"
echo "Total Tests: 12 (Phase 1: 7, Phase 2: 4, Phase 3 fix: 1)" | tee -a "$EVIDENCE_DIR/regression-tests.log"
echo "PASSED: $PASSED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
echo "FAILED: $FAILED" | tee -a "$EVIDENCE_DIR/regression-tests.log"
echo "Success Rate: $(( PASSED * 100 / (PASSED + FAILED) ))%" | tee -a "$EVIDENCE_DIR/regression-tests.log"
echo "=== END ===" | tee -a "$EVIDENCE_DIR/regression-tests.log"
