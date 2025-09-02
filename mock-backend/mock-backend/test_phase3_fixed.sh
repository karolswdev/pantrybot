#!/bin/bash

BASE_URL="http://localhost:8080/api/v1"
EVIDENCE_DIR="./evidence/PHASE-MBE-3/QA/test-output"

# Create evidence directory
mkdir -p "$EVIDENCE_DIR"

echo "=== PHASE MBE-3 TEST EXECUTION ===" | tee "$EVIDENCE_DIR/phase3-execution.log"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# Test results counters
PASSED=0
FAILED=0

# Register a test user with simpler password
echo "Setting up test user..." | tee -a "$EVIDENCE_DIR/phase3-execution.log"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "qa-phase3@fridgr.app", "password": "Test123456", "displayName": "QA Phase3 Tester"}')

USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"userId":"[^"]*' | cut -d'"' -f4)
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
HOUSEHOLD_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"defaultHouseholdId":"[^"]*' | cut -d'"' -f4)

echo "User ID: $USER_ID" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Household ID: $HOUSEHOLD_ID" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# TC-MBE-3.1: Test auth middleware - Access without token returns 401
echo "=== TC-MBE-3.1: Testing auth middleware ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Test: GET /households/$HOUSEHOLD_ID/items without Authorization header" | tee "$EVIDENCE_DIR/TC-MBE-3.1.log"
echo "Command: curl -s -w '\nHTTP_STATUS: %{http_code}' -X GET \"$BASE_URL/households/$HOUSEHOLD_ID/items\"" | tee -a "$EVIDENCE_DIR/TC-MBE-3.1.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X GET "$BASE_URL/households/$HOUSEHOLD_ID/items")
echo "$RESPONSE" | tee -a "$EVIDENCE_DIR/TC-MBE-3.1.log"
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "401" ]; then
    echo "✓ TC-MBE-3.1 PASSED: Returned 401 as expected" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-3.1 FAILED: Expected 401, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((FAILED++))
fi
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# TC-MBE-3.2: List items with valid token returns 200 and items  
echo "=== TC-MBE-3.2: Testing list items with valid token ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Test: GET /households/$HOUSEHOLD_ID/items with valid Bearer token" | tee "$EVIDENCE_DIR/TC-MBE-3.2.log"
echo "Command: curl -s -w '\nHTTP_STATUS: %{http_code}' -X GET \"$BASE_URL/households/$HOUSEHOLD_ID/items\" -H \"Authorization: Bearer $ACCESS_TOKEN\"" | tee -a "$EVIDENCE_DIR/TC-MBE-3.2.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X GET "$BASE_URL/households/$HOUSEHOLD_ID/items" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$RESPONSE" | tee -a "$EVIDENCE_DIR/TC-MBE-3.2.log"
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ TC-MBE-3.2 PASSED: Returned 200 with items list" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-3.2 FAILED: Expected 200, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((FAILED++))
fi
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# TC-MBE-3.3: Add item with valid data returns 201
echo "=== TC-MBE-3.3: Testing add item ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Test: POST /households/$HOUSEHOLD_ID/items with valid data" | tee "$EVIDENCE_DIR/TC-MBE-3.3.log"
ADD_ITEM_DATA='{"name": "Test Milk", "quantity": 2, "unit": "liters", "location": "fridge", "category": "dairy", "expirationDate": "2024-02-01", "notes": "Test item for QA"}'
echo "Request body: $ADD_ITEM_DATA" | tee -a "$EVIDENCE_DIR/TC-MBE-3.3.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/households/$HOUSEHOLD_ID/items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$ADD_ITEM_DATA")
echo "$RESPONSE" | tee -a "$EVIDENCE_DIR/TC-MBE-3.3.log"
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
ITEM_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
if [ "$HTTP_STATUS" = "201" ]; then
    echo "✓ TC-MBE-3.3 PASSED: Returned 201 with new item" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    echo "Created Item ID: $ITEM_ID" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-3.3 FAILED: Expected 201, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((FAILED++))
fi
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# TC-MBE-3.4: Update item with correct ETag returns 200
echo "=== TC-MBE-3.4: Testing update item with correct ETag ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Test: PATCH /households/$HOUSEHOLD_ID/items/$ITEM_ID with correct ETag" | tee "$EVIDENCE_DIR/TC-MBE-3.4.log"

# First GET the item to get ETag
echo "Step 1: GET item to retrieve ETag" | tee -a "$EVIDENCE_DIR/TC-MBE-3.4.log"
RESPONSE=$(curl -s -i -X GET "$BASE_URL/households/$HOUSEHOLD_ID/items/$ITEM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$RESPONSE" | tee -a "$EVIDENCE_DIR/TC-MBE-3.4.log"
ETAG=$(echo "$RESPONSE" | grep -i "^etag:" | sed 's/[[:space:]]*$//' | cut -d' ' -f2- | tr -d '\r')
echo "Retrieved ETag: $ETAG" | tee -a "$EVIDENCE_DIR/TC-MBE-3.4.log"

# Now PATCH with the ETag
echo "Step 2: PATCH with correct ETag" | tee -a "$EVIDENCE_DIR/TC-MBE-3.4.log"
UPDATE_DATA='{"quantity": 1.5, "notes": "Updated via test"}'
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X PATCH "$BASE_URL/households/$HOUSEHOLD_ID/items/$ITEM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "If-Match: $ETAG" \
  -d "$UPDATE_DATA")
echo "$RESPONSE" | tee -a "$EVIDENCE_DIR/TC-MBE-3.4.log"
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ TC-MBE-3.4 PASSED: Update with correct ETag returned 200" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-3.4 FAILED: Expected 200, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((FAILED++))
fi
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# TC-MBE-3.5: Update item with stale ETag returns 409
echo "=== TC-MBE-3.5: Testing update item with stale ETag ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Test: PATCH /households/$HOUSEHOLD_ID/items/$ITEM_ID with stale ETag" | tee "$EVIDENCE_DIR/TC-MBE-3.5.log"
STALE_ETAG='W/"stale-etag-123"'
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X PATCH "$BASE_URL/households/$HOUSEHOLD_ID/items/$ITEM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "If-Match: $STALE_ETAG" \
  -d '{"quantity": 3}')
echo "$RESPONSE" | tee -a "$EVIDENCE_DIR/TC-MBE-3.5.log"
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "409" ]; then
    echo "✓ TC-MBE-3.5 PASSED: Update with stale ETag returned 409" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-3.5 FAILED: Expected 409, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((FAILED++))
fi
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# TC-MBE-3.6: Consume item with valid quantity returns 200
echo "=== TC-MBE-3.6: Testing consume item ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Test: POST /households/$HOUSEHOLD_ID/items/$ITEM_ID/consume" | tee "$EVIDENCE_DIR/TC-MBE-3.6.log"
CONSUME_DATA='{"quantity": 0.5, "notes": "Used for breakfast"}'
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/households/$HOUSEHOLD_ID/items/$ITEM_ID/consume" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CONSUME_DATA")
echo "$RESPONSE" | tee -a "$EVIDENCE_DIR/TC-MBE-3.6.log"
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ TC-MBE-3.6 PASSED: Consume item returned 200" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-3.6 FAILED: Expected 200, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((FAILED++))
fi
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# TC-MBE-3.7: Waste item with valid quantity and reason returns 200
echo "=== TC-MBE-3.7: Testing waste item ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Test: POST /households/$HOUSEHOLD_ID/items/$ITEM_ID/waste" | tee "$EVIDENCE_DIR/TC-MBE-3.7.log"
WASTE_DATA='{"quantity": 0.5, "reason": "expired", "notes": "Test waste"}'
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X POST "$BASE_URL/households/$HOUSEHOLD_ID/items/$ITEM_ID/waste" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$WASTE_DATA")
echo "$RESPONSE" | tee -a "$EVIDENCE_DIR/TC-MBE-3.7.log"
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ TC-MBE-3.7 PASSED: Waste item returned 200" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-3.7 FAILED: Expected 200, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((FAILED++))
fi
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# Create a new item for deletion test
echo "Creating new item for deletion test..." | tee -a "$EVIDENCE_DIR/phase3-execution.log"
RESPONSE=$(curl -s -X POST "$BASE_URL/households/$HOUSEHOLD_ID/items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Item to Delete", "quantity": 1, "location": "pantry"}')
DELETE_ITEM_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Created item for deletion: $DELETE_ITEM_ID" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

# TC-MBE-3.8: Delete item with valid ID returns 204
echo "=== TC-MBE-3.8: Testing delete item ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Test: DELETE /households/$HOUSEHOLD_ID/items/$DELETE_ITEM_ID" | tee "$EVIDENCE_DIR/TC-MBE-3.8.log"
RESPONSE=$(curl -s -w '\nHTTP_STATUS: %{http_code}' -X DELETE "$BASE_URL/households/$HOUSEHOLD_ID/items/$DELETE_ITEM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$RESPONSE" | tee -a "$EVIDENCE_DIR/TC-MBE-3.8.log"
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d' ' -f2)
if [ "$HTTP_STATUS" = "204" ]; then
    echo "✓ TC-MBE-3.8 PASSED: Delete item returned 204" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((PASSED++))
else
    echo "✗ TC-MBE-3.8 FAILED: Expected 204, got $HTTP_STATUS" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
    ((FAILED++))
fi
echo "" | tee -a "$EVIDENCE_DIR/phase3-execution.log"

echo "=== PHASE MBE-3 TEST RESULTS ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "PASSED: $PASSED / 8" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "FAILED: $FAILED / 8" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "Success Rate: $(( PASSED * 100 / 8 ))%" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
echo "=== END ===" | tee -a "$EVIDENCE_DIR/phase3-execution.log"
