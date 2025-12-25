#!/bin/bash
set -x

# Clean test - register a fresh user
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test_stat@example.com", "password": "Test123!@#", "displayName": "StatTest", "timezone": "UTC"}')

TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
HOUSEHOLD=$(echo $RESPONSE | grep -o '"defaultHouseholdId":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
echo "Household: $HOUSEHOLD"

# Add test items to get real statistics
TODAY=$(date +%Y-%m-%d)
EXPIRED=$(date -d "2 days ago" +%Y-%m-%d)
EXPIRING=$(date -d "2 days" +%Y-%m-%d)

# Add expired item
curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Expired Item\", \"quantity\": 1, \"unit\": \"piece\", \"location\": \"fridge\", \"expirationDate\": \"$EXPIRED\"}" > /dev/null

# Add expiring items (2)
curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Expiring1\", \"quantity\": 1, \"unit\": \"piece\", \"location\": \"fridge\", \"expirationDate\": \"$EXPIRING\"}" > /dev/null

curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Expiring2\", \"quantity\": 1, \"unit\": \"piece\", \"location\": \"fridge\", \"expirationDate\": \"$EXPIRING\"}" > /dev/null

# Add fresh item
curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Fresh\", \"quantity\": 1, \"unit\": \"piece\", \"location\": \"fridge\", \"expirationDate\": \"2025-09-20\"}" > /dev/null

echo ""
echo "=== Testing GET /api/v1/households/$HOUSEHOLD/statistics (TC-MBE-6.1) ==="
curl -iS -X GET "http://localhost:8080/api/v1/households/$HOUSEHOLD/statistics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
