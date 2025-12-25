#!/bin/bash
set -x

# Register a new test user
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "filtertest@example.com", "password": "Test123!@#", "displayName": "FilterTest", "timezone": "UTC"}')

TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
HOUSEHOLD=$(echo $RESPONSE | grep -o '"defaultHouseholdId":"[^"]*' | cut -d'"' -f4)

# Add test items for filtering
TODAY=$(date +%Y-%m-%d)
EXPIRED=$(date -d "2 days ago" +%Y-%m-%d)
EXPIRING=$(date -d "2 days" +%Y-%m-%d)
FRESH=$(date -d "10 days" +%Y-%m-%d)

# Add various items for search and status tests
curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Milk\", \"quantity\": 1, \"unit\": \"liter\", \"location\": \"fridge\", \"category\": \"dairy\", \"expirationDate\": \"$FRESH\"}" > /dev/null

curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Almond Milk\", \"quantity\": 1, \"unit\": \"liter\", \"location\": \"fridge\", \"category\": \"dairy\", \"expirationDate\": \"$EXPIRING\"}" > /dev/null

curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Cheese\", \"quantity\": 200, \"unit\": \"g\", \"location\": \"fridge\", \"category\": \"dairy\", \"expirationDate\": \"$EXPIRED\"}" > /dev/null

curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Bread\", \"quantity\": 1, \"unit\": \"loaf\", \"location\": \"pantry\", \"category\": \"grains\", \"expirationDate\": \"$EXPIRING\"}" > /dev/null

echo ""
echo "=== TC-MBE-6.2: Testing GET /api/v1/households/$HOUSEHOLD/items with search=Milk ==="
echo "Request: curl -X GET 'http://localhost:8080/api/v1/households/$HOUSEHOLD/items?search=Milk'"
echo ""
SEARCH_RESPONSE=$(curl -s -X GET "http://localhost:8080/api/v1/households/$HOUSEHOLD/items?search=Milk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

echo "Response Headers:"
curl -iS -X GET "http://localhost:8080/api/v1/households/$HOUSEHOLD/items?search=Milk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" 2>&1 | grep -E "^HTTP|^[A-Z].*:" 

echo ""
echo "Response Body:"
echo "$SEARCH_RESPONSE" | python3 -m json.tool

# Count matching items
MILK_COUNT=$(echo "$SEARCH_RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(len([i for i in data.get('items', []) if 'Milk' in i['name']]))")
echo "Items containing 'Milk': $MILK_COUNT"

echo ""
echo "=== TC-MBE-6.3: Testing GET /api/v1/households/$HOUSEHOLD/items with status=expiring_soon ==="
echo "Request: curl -X GET 'http://localhost:8080/api/v1/households/$HOUSEHOLD/items?status=expiring_soon'"
echo ""

STATUS_RESPONSE=$(curl -s -X GET "http://localhost:8080/api/v1/households/$HOUSEHOLD/items?status=expiring_soon" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

echo "Response Headers:"
curl -iS -X GET "http://localhost:8080/api/v1/households/$HOUSEHOLD/items?status=expiring_soon" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" 2>&1 | grep -E "^HTTP|^[A-Z].*:"

echo ""
echo "Response Body:"
echo "$STATUS_RESPONSE" | python3 -m json.tool

# Count expiring items  
EXPIRING_COUNT=$(echo "$STATUS_RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(len([i for i in data.get('items', []) if i['expirationStatus'] == 'expiring_soon']))")
echo "Items with status 'expiring_soon': $EXPIRING_COUNT"
