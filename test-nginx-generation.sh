#!/bin/bash

# Test script for VC-DEPLOY-1.4: Verify Nginx script generates correct configuration

set -e

echo "=== Test Case VC-DEPLOY-1.4: Nginx Script Generates Config ==="
echo "Testing script: scripts/generate-nginx-conf.sh"
echo "Test domain: pantrybot.app"
echo ""

# Clean up any existing test config
rm -f pantrybot.app.conf

# Execute the script
echo "Executing: ./scripts/generate-nginx-conf.sh pantrybot.app"
./scripts/generate-nginx-conf.sh pantrybot.app

echo ""
echo "=== Verification Steps ==="

# Check if file was created
if [ -f "pantrybot.app.conf" ]; then
    echo "✓ File pantrybot.app.conf was created successfully"
else
    echo "✗ FAIL: File pantrybot.app.conf was not created"
    exit 1
fi

# Check for server names
echo ""
echo "Checking server names..."
if grep -q "server_name pantrybot.app;" pantrybot.app.conf; then
    echo "✓ Found server_name pantrybot.app"
else
    echo "✗ FAIL: server_name pantrybot.app not found"
    exit 1
fi

if grep -q "server_name api.pantrybot.app;" pantrybot.app.conf; then
    echo "✓ Found server_name api.pantrybot.app"
else
    echo "✗ FAIL: server_name api.pantrybot.app not found"
    exit 1
fi

# Check for proxy_pass directives with correct ports
echo ""
echo "Checking proxy_pass directives..."

# Check frontend proxy to port 3010
if grep -q "server localhost:3010;" pantrybot.app.conf; then
    echo "✓ Found upstream frontend configuration with port 3010"
else
    echo "✗ FAIL: Frontend upstream with port 3010 not found"
    exit 1
fi

# Check API proxy to port 8088  
if grep -q "server localhost:8088;" pantrybot.app.conf; then
    echo "✓ Found upstream API configuration with port 8088"
else
    echo "✗ FAIL: API upstream with port 8088 not found"
    exit 1
fi

# Check for WebSocket support
echo ""
echo "Checking WebSocket support..."
if grep -q "location /ws {" pantrybot.app.conf && grep -q 'proxy_set_header Upgrade $http_upgrade;' pantrybot.app.conf; then
    echo "✓ Found WebSocket support configuration"
else
    echo "✗ FAIL: WebSocket support not properly configured"
    exit 1
fi

echo ""
echo "=== TEST PASSED ==="
echo "All verification criteria met for VC-DEPLOY-1.4"
echo ""
echo "Generated configuration file content (first 50 lines):"
echo "---------------------------------------------------"
head -n 50 pantrybot.app.conf