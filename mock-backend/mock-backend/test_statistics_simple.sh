#!/bin/bash

# Register a user
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test3@example.com", "password": "Test123!@#", "displayName": "Test3", "timezone": "UTC"}')

TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
HOUSEHOLD=$(echo $RESPONSE | grep -o '"defaultHouseholdId":"[^"]*' | cut -d'"' -f4)

# Test statistics endpoint
echo "Testing /api/v1/households/$HOUSEHOLD/statistics"
curl -s -X GET "http://localhost:8080/api/v1/households/$HOUSEHOLD/statistics" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
