#!/bin/bash

# Script to set up SSL certificates for Fridgr application using Let's Encrypt
# Usage: ./setup-ssl.sh <domain> <email>
# Example: ./setup-ssl.sh pantrybot.app admin@pantrybot.app

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

# Check arguments
if [ $# -lt 2 ]; then
    echo "Error: Domain name and email are required"
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 pantrybot.app admin@pantrybot.app"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo "=== SSL Certificate Setup for ${DOMAIN} ==="
echo "Email: ${EMAIL}"
echo ""

# Step 1: Update package lists
echo "Step 1: Updating package lists..."
apt-get update

# Step 2: Install Certbot and Nginx plugin
echo ""
echo "Step 2: Installing Certbot and python3-certbot-nginx..."
apt-get install -y certbot python3-certbot-nginx

# Step 3: Check if Nginx configuration exists
echo ""
echo "Step 3: Checking Nginx configuration..."
if [ ! -f "/etc/nginx/sites-available/${DOMAIN}.conf" ]; then
    echo "Warning: Nginx configuration not found at /etc/nginx/sites-available/${DOMAIN}.conf"
    echo "Please ensure the Nginx configuration is properly set up before running this script."
    echo "Run: ./scripts/generate-nginx-conf.sh ${DOMAIN}"
    echo "Then copy the configuration to /etc/nginx/sites-available/"
    exit 1
fi

# Step 4: Test Nginx configuration
echo ""
echo "Step 4: Testing Nginx configuration..."
nginx -t
if [ $? -ne 0 ]; then
    echo "Error: Nginx configuration test failed"
    exit 1
fi

# Step 5: Obtain SSL certificate
echo ""
echo "Step 5: Obtaining SSL certificate from Let's Encrypt..."
echo "Domains: ${DOMAIN}, api.${DOMAIN}"

certbot --nginx \
    -d ${DOMAIN} \
    -d api.${DOMAIN} \
    --non-interactive \
    --agree-tos \
    -m ${EMAIL} \
    --redirect \
    --expand

# Check if certificate was obtained successfully
if [ $? -eq 0 ]; then
    echo "✓ SSL certificate obtained successfully"
else
    echo "✗ Failed to obtain SSL certificate"
    exit 1
fi

# Step 6: Enable auto-renewal
echo ""
echo "Step 6: Configuring automatic certificate renewal..."

# Check if systemd timer exists
if systemctl list-timers | grep -q certbot; then
    echo "✓ Certbot renewal timer is already active"
    systemctl status certbot.timer --no-pager
else
    # Set up cron job as fallback
    echo "Setting up cron job for certificate renewal..."
    (crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/bin/certbot renew --quiet") | crontab -
    echo "✓ Cron job added for certificate renewal (runs twice daily)"
fi

# Step 7: Test renewal
echo ""
echo "Step 7: Testing certificate renewal (dry run)..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo "✓ Certificate renewal test passed"
else
    echo "⚠ Warning: Certificate renewal test failed"
    echo "Please check the configuration manually"
fi

# Step 8: Reload Nginx with new configuration
echo ""
echo "Step 8: Reloading Nginx..."
systemctl reload nginx

echo ""
echo "=== SSL Setup Complete ==="
echo ""
echo "Your sites are now accessible via HTTPS:"
echo "  - https://${DOMAIN}"
echo "  - https://api.${DOMAIN}"
echo ""
echo "Certificate details:"
certbot certificates --cert-name ${DOMAIN}
echo ""
echo "Auto-renewal is configured and will run automatically."
echo "To manually renew certificates, run: sudo certbot renew"
echo ""
echo "✓ SSL configuration completed successfully!"