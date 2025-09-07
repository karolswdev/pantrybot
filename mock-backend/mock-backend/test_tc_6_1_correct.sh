#!/bin/bash
set -x

# Register a new test user
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "mbe6test@example.com", "password": "Test123!@#", "displayName": "MBE6Test", "timezone": "UTC"}')

TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
HOUSEHOLD=$(echo $RESPONSE | grep -o '"defaultHouseholdId":"[^"]*' | cut -d'"' -f4)

# Add test items
TODAY=$(date +%Y-%m-%d)
EXPIRED=$(date -d "2 days ago" +%Y-%m-%d)
EXPIRING=$(date -d "2 days" +%Y-%m-%d)

# Add items
curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Expired Item\", \"quantity\": 1, \"unit\": \"piece\", \"location\": \"fridge\", \"expirationDate\": \"$EXPIRED\"}" > /dev/null

curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Expiring1\", \"quantity\": 1, \"unit\": \"piece\", \"location\": \"fridge\", \"expirationDate\": \"$EXPIRING\"}" > /dev/null

curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Expiring2\", \"quantity\": 1, \"unit\": \"piece\", \"location\": \"fridge\", \"expirationDate\": \"$EXPIRING\"}" > /dev/null

curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Fresh\", \"quantity\": 1, \"unit\": \"piece\", \"location\": \"fridge\", \"expirationDate\": \"2025-09-20\"}" > /dev/null

echo ""
echo "=== TC-MBE-6.1: Testing GET /api/v1/households/$HOUSEHOLD/statistics ==="
echo "Request: curl -X GET http://localhost:8080/api/v1/households/$HOUSEHOLD/statistics"
echo ""
curl -iS -X GET "http://localhost:8080/api/v1/households/$HOUSEHOLD/statistics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
