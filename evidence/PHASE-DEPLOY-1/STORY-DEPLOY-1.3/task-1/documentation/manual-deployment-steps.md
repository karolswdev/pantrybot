# Manual Deployment Steps for Staging VPS

## Overview
This document provides the step-by-step instructions for manually deploying the Fridgr application to the staging VPS.

## Prerequisites
- SSH access to the staging VPS
- GitHub personal access token with `read:packages` permission for pulling Docker images
- Domain names configured: pantrybot.app and api.pantrybot.app pointing to the VPS IP

## Deployment Steps

### Step 1: Connect to the VPS
```bash
ssh <username>@<vps-ip-address>
```

### Step 2: Update the Repository
Navigate to the application directory and pull the latest changes:
```bash
cd /path/to/fridgr
git pull origin main
```

### Step 3: Generate Nginx Configuration
Generate the Nginx configuration for the pantrybot.app domain:
```bash
sudo ./scripts/generate-nginx-conf.sh pantrybot.app
```

Expected output: A file named `pantrybot.app.conf` should be created in the current directory.

### Step 4: Install Nginx Configuration
Copy the generated configuration to Nginx sites-available:
```bash
sudo cp pantrybot.app.conf /etc/nginx/sites-available/
```

### Step 5: Enable the Site
Create a symbolic link to enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/pantrybot.app.conf /etc/nginx/sites-enabled/
```

### Step 6: Setup SSL Certificates
Run the SSL setup script to obtain Let's Encrypt certificates:
```bash
sudo ./scripts/setup-ssl.sh pantrybot.app
```

**Note:** You will need to provide an email address for Let's Encrypt registration when prompted.

### Step 7: Deploy the Application
Execute the deployment script:
```bash
./scripts/deploy.sh
```

When prompted, enter your GitHub personal access token to authenticate with the GitHub Container Registry (ghcr.io).

The script will:
1. Log in to ghcr.io
2. Pull the latest Docker images
3. Restart the services using docker-compose
4. Prune old Docker images

## Verification Checklist

After deployment, verify the following:

- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Docker containers are running: `docker-compose -f docker-compose.yml -f docker-compose.staging.yml ps`
- [ ] Frontend is accessible: Visit https://pantrybot.app
- [ ] API is accessible: Visit https://api.pantrybot.app/health
- [ ] SSL certificates are properly installed: Check for padlock icon in browser

## Troubleshooting

### Nginx Issues
If Nginx fails to start:
```bash
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
sudo journalctl -u nginx -n 50  # View logs
```

### Docker Issues
If containers fail to start:
```bash
docker-compose -f docker-compose.yml -f docker-compose.staging.yml logs
docker-compose -f docker-compose.yml -f docker-compose.staging.yml down
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### SSL Certificate Issues
If SSL setup fails:
```bash
sudo certbot certificates  # List existing certificates
sudo certbot delete --cert-name pantrybot.app  # Remove if needed
sudo ./scripts/setup-ssl.sh pantrybot.app  # Retry setup
```

## Important Notes

1. **Port Configuration**: The staging configuration uses:
   - Frontend: Internal port 3010 (proxied by Nginx)
   - Mock Backend: Internal port 8088 (proxied by Nginx)

2. **Environment Variables**: The staging docker-compose override sets:
   - `NEXT_PUBLIC_API_URL=https://api.pantrybot.app/api/v1`

3. **Security**: Ensure that only Nginx ports (80, 443) are exposed to the internet. Docker container ports should not be directly accessible.

## Completion Criteria

The deployment is considered successful when:
1. All Docker containers are running without errors
2. The frontend is accessible at https://pantrybot.app
3. The API health endpoint returns `{"status":"ok"}` at https://api.pantrybot.app/health
4. SSL certificates are properly installed and auto-renewal is configured