#!/bin/bash
set -x

# Register a test user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "displayName": "Test User",
    "timezone": "America/New_York"
  }')

echo "Register Response: $REGISTER_RESPONSE"

# Extract tokens
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
HOUSEHOLD_ID=$(echo $REGISTER_RESPONSE | grep -o '"defaultHouseholdId":"[^"]*' | cut -d'"' -f4)

echo "Access Token: $ACCESS_TOKEN"
echo "Household ID: $HOUSEHOLD_ID"

# Add some test items with various expiration statuses
TODAY=$(date +%Y-%m-%d)
EXPIRED=$(date -d "2 days ago" +%Y-%m-%d)
EXPIRING_SOON=$(date -d "2 days" +%Y-%m-%d)
FRESH=$(date -d "10 days" +%Y-%m-%d)

# Add expired item
curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD_ID/items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Expired Milk\",
    \"quantity\": 1,
    \"unit\": \"liter\",
    \"location\": \"fridge\",
    \"category\": \"dairy\",
    \"expirationDate\": \"$EXPIRED\"
  }"

# Add expiring soon item
curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD_ID/items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Expiring Yogurt\",
    \"quantity\": 2,
    \"unit\": \"cup\",
    \"location\": \"fridge\",
    \"category\": \"dairy\",
    \"expirationDate\": \"$EXPIRING_SOON\"
  }"

# Add fresh item
curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD_ID/items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Fresh Bread\",
    \"quantity\": 1,
    \"unit\": \"loaf\",
    \"location\": \"pantry\",
    \"category\": \"grains\",
    \"expirationDate\": \"$FRESH\"
  }"

# Add item with no expiration
curl -s -X POST "http://localhost:8080/api/v1/households/$HOUSEHOLD_ID/items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Rice\",
    \"quantity\": 5,
    \"unit\": \"kg\",
    \"location\": \"pantry\",
    \"category\": \"grains\"
  }"

# Now test the statistics endpoint (TC-MBE-6.1)
echo ""
echo "=== Testing GET /api/v1/households/$HOUSEHOLD_ID/statistics (TC-MBE-6.1) ==="
curl -iS -X GET "http://localhost:8080/api/v1/households/$HOUSEHOLD_ID/statistics" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
