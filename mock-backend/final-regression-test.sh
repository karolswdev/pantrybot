#!/bin/bash

# Final Regression Test for PHASE-MBE-2
# This script runs ALL test cases from Phase 1 and Phase 2

echo "=========================================="
echo "FINAL REGRESSION TEST - PHASE-MBE-2"
echo "Date: $(date)"
echo "=========================================="
echo ""

# Test counters
PASSED=0
FAILED=0
TOTAL=13

# Base URL
BASE_URL="http://localhost:8080/api/v1"

# Test helper function
run_test() {
    TEST_ID=$1
    TEST_NAME=$2
    echo "Running Test: $TEST_ID - $TEST_NAME"
    echo "----------------------------------------"
}

# Phase 1 Tests
echo "=== PHASE 1 TESTS (7 tests) ==="
echo ""

# TC-MBE-1.1: Health Check Endpoint Returns 200
run_test "TC-MBE-1.1" "Health Check Endpoint Returns 200"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:8080/health)
STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "200" ]; then
    echo "✓ PASSED - Health check returned 200"
    ((PASSED++))
else
    echo "✗ FAILED - Health check did not return 200 (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-1.2: User Registration Creates Account
run_test "TC-MBE-1.2" "User Registration Creates Account"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123","displayName":"Test User"}' \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$REGISTER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "201" ]; then
    echo "✓ PASSED - Registration returned 201"
    ((PASSED++))
else
    echo "✗ FAILED - Registration did not return 201 (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-1.3: User Registration Prevents Duplicate Email
run_test "TC-MBE-1.3" "User Registration Prevents Duplicate Email"
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123","displayName":"Test User"}' \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$DUPLICATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "409" ]; then
    echo "✓ PASSED - Duplicate registration returned 409"
    ((PASSED++))
else
    echo "✗ FAILED - Duplicate registration did not return 409 (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-1.4: User Login Returns Valid Token
run_test "TC-MBE-1.4" "User Login Returns Valid Token"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123"}' \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "200" ] && echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo "✓ PASSED - Login returned 200 with accessToken"
    ((PASSED++))
    # Extract token for later tests
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo "✗ FAILED - Login did not return 200 with accessToken (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-1.5: Invalid Credentials Return 401
run_test "TC-MBE-1.5" "Invalid Credentials Return 401"
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"WrongPassword"}' \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "401" ]; then
    echo "✓ PASSED - Invalid credentials returned 401"
    ((PASSED++))
else
    echo "✗ FAILED - Invalid credentials did not return 401 (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-1.6: Non-existent User Returns 401
run_test "TC-MBE-1.6" "Non-existent User Returns 401"
NONEXISTENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@example.com","password":"Password123"}' \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$NONEXISTENT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "401" ]; then
    echo "✓ PASSED - Non-existent user returned 401"
    ((PASSED++))
else
    echo "✗ FAILED - Non-existent user did not return 401 (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-1.7: Refresh Token Rotates Successfully
run_test "TC-MBE-1.7" "Refresh Token Rotates Successfully"
# First login to get tokens
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123"}')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

# Try to refresh
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$REFRESH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "200" ] && echo "$REFRESH_RESPONSE" | grep -q "accessToken"; then
    echo "✓ PASSED - Refresh token returned 200 with new tokens"
    ((PASSED++))
else
    echo "✗ FAILED - Refresh token did not return 200 with new tokens (got $STATUS)"
    ((FAILED++))
fi
echo ""

# Phase 2 Tests
echo "=== PHASE 2 TESTS (6 tests) ==="
echo ""

# Get fresh token for Phase 2 tests
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Password123"}')
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# TC-MBE-2.1: Access Protected Endpoint Without Token Returns 401
run_test "TC-MBE-2.1" "Access Protected Endpoint Without Token Returns 401"
UNAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/households" \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$UNAUTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "401" ]; then
    echo "✓ PASSED - Unauthorized access returned 401"
    ((PASSED++))
else
    echo "✗ FAILED - Unauthorized access did not return 401 (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-2.2: List Households With Valid Token Returns 200
run_test "TC-MBE-2.2" "List Households With Valid Token Returns 200"
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/households" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$LIST_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "200" ] && echo "$LIST_RESPONSE" | grep -q "households"; then
    echo "✓ PASSED - List households returned 200 with households array"
    ((PASSED++))
    # Extract first household ID for later tests
    HOUSEHOLD_ID=$(echo "$LIST_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
else
    echo "✗ FAILED - List households did not return 200 with households array (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-2.3: Create Household With Valid Data Returns 201
run_test "TC-MBE-2.3" "Create Household With Valid Data Returns 201"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/households" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Household","timezone":"America/New_York"}' \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$CREATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "201" ] && echo "$CREATE_RESPONSE" | grep -q "\"id\""; then
    echo "✓ PASSED - Create household returned 201 with new household"
    ((PASSED++))
    NEW_HOUSEHOLD_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
    echo "✗ FAILED - Create household did not return 201 with new household (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-2.4: Get Household Details With Valid ID Returns 200
run_test "TC-MBE-2.4" "Get Household Details With Valid ID Returns 200"
DETAILS_RESPONSE=$(curl -s -X GET "$BASE_URL/households/$HOUSEHOLD_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$DETAILS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "200" ] && echo "$DETAILS_RESPONSE" | grep -q "statistics"; then
    echo "✓ PASSED - Get household details returned 200 with statistics"
    ((PASSED++))
else
    echo "✗ FAILED - Get household details did not return 200 with statistics (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-2.5: Invite Member With Valid Data Returns 201
run_test "TC-MBE-2.5" "Invite Member With Valid Data Returns 201"
INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/households/$HOUSEHOLD_ID/members" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"email":"invitee@example.com","role":"member"}' \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$INVITE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "201" ]; then
    echo "✓ PASSED - Invite member returned 201"
    ((PASSED++))
else
    echo "✗ FAILED - Invite member did not return 201 (got $STATUS)"
    ((FAILED++))
fi
echo ""

# TC-MBE-2.6: Invite Member As Non-Admin Returns 403
run_test "TC-MBE-2.6" "Invite Member As Non-Admin Returns 403"
# First, create a second user
curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"member@example.com","password":"Password123","displayName":"Member User"}' > /dev/null

# Login as admin and invite the member
ADMIN_TOKEN=$ACCESS_TOKEN
curl -s -X POST "$BASE_URL/households/$HOUSEHOLD_ID/members" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"email":"member@example.com","role":"member"}' > /dev/null

# Login as the member
MEMBER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"member@example.com","password":"Password123"}')
MEMBER_TOKEN=$(echo "$MEMBER_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Try to invite someone as a member (should fail with 403)
FORBIDDEN_RESPONSE=$(curl -s -X POST "$BASE_URL/households/$HOUSEHOLD_ID/members" \
    -H "Authorization: Bearer $MEMBER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"email":"another@example.com","role":"member"}' \
    -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$FORBIDDEN_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$STATUS" = "403" ]; then
    echo "✓ PASSED - Non-admin invite returned 403"
    ((PASSED++))
else
    echo "✗ FAILED - Non-admin invite did not return 403 (got $STATUS)"
    ((FAILED++))
fi
echo ""

# Final Summary
echo "=========================================="
echo "FINAL REGRESSION TEST SUMMARY"
echo "=========================================="
echo "Total Tests: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✓ ALL TESTS PASSED - Phase MBE-2 Final Acceptance Gate Complete!"
    exit 0
else
    echo "✗ SOME TESTS FAILED - Please review and fix before completing the phase."
    exit 1
fi