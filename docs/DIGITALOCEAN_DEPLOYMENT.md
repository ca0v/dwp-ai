# DigitalOcean Deployment Setup

This guide walks you through setting up automated deployment to DigitalOcean via GitHub Actions.

## Architecture

```
Push to 'live' branch
         ↓
GitHub Actions Workflow
         ↓
Build with Bun (npm dependencies, TypeScript)
         ↓
Create deployment package
         ↓
SSH transfer to DigitalOcean
         ↓
Remote deployment (extract, install, restart service)
```

## Prerequisites

### Local Machine
- Git
- GitHub CLI (`gh`) - [Install here](https://cli.github.com/)
- Authenticated with GitHub: `gh auth login`

### DigitalOcean Droplet
- Ubuntu/Debian droplet with SSH access
- Sufficient disk space for uploads
- Port 3000 (or your chosen port) accessible or behind a reverse proxy

## Step 1: Generate SSH Key (if you don't have one)

On your local machine:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/digitalocean -C "dwp-ai-deployment"
# Press Enter twice to skip passphrase
```

Add the public key to your DigitalOcean droplet:

```bash
# Copy the public key
cat ~/.ssh/digitalocean.pub

# On your DigitalOcean droplet, add to authorized_keys
ssh root@<your-droplet-ip>
# Then run:
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Step 2: Prepare Your DigitalOcean Droplet

SSH into your droplet:

```bash
ssh root@<your-droplet-ip>
```

Run these setup commands:

```bash
# Update system
apt-get update && apt-get upgrade -y

# Create application directory
mkdir -p /home/user/dwp-ai
cd /home/user/dwp-ai

# Create uploads directory with proper permissions
mkdir -p /var/data/uploads
chmod 777 /var/data/uploads

# Verify SSH access works
# Test from your local machine:
# ssh -i ~/.ssh/digitalocean root@<your-droplet-ip> "echo 'SSH works!'"
```

## Step 3: Set Up GitHub Secrets

Run the setup script on your local machine:

```bash
cd /path/to/dwp-ai
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

This interactive script will prompt you for:

### DigitalOcean Configuration
- **DIGITALOCEAN_HOST**: Your droplet IP or hostname
- **DIGITALOCEAN_USER**: SSH user (usually `root`)
- **DIGITALOCEAN_SSH_PORT**: SSH port (default: 22)
- **DIGITALOCEAN_APP_PATH**: Where to deploy (e.g., `/home/user/dwp-ai`)
- **DIGITALOCEAN_SSH_KEY**: Your private SSH key (paste the entire key from `~/.ssh/digitalocean`)

### AI Configuration
- **AI_PROVIDER_URL**: Your AI API endpoint (e.g., `https://api.xai.com/v1`)
- **AI_API_KEY**: Your API key (treated as secret)
- **AI_MODEL**: Model name (default: `grok-2-vision-1212`)
- **AI_PROFILE**: Profile type (default: `general`)
- **AI_TIMEOUT_MS**: Request timeout (default: `30000`)

### Optional
- **UPLOADS_DIR**: Where to store photos (default: `/var/data/uploads`)
- **PORT**: Application port (default: `3000`)

## Step 4: Deploy

Push to the `live` branch to trigger automatic deployment:

```bash
git checkout -b live  # if first time
git push -u origin live
```

Or merge your code into the live branch:

```bash
git checkout live
git merge your-feature-branch
git push origin live
```

## Step 5: Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select the **Deploy to DigitalOcean** workflow
4. Monitor the running job

### Troubleshooting Deployment Issues

**Check remote logs:**
```bash
ssh -i ~/.ssh/digitalocean root@<your-droplet-ip>
tail -f /home/user/dwp-ai/deploy/server.log
```

**Verify service is running:**
```bash
ssh -i ~/.ssh/digitalocean root@<your-droplet-ip>
ps aux | grep "bun.*src/server"
```

**Check environment variables:**
```bash
ssh -i ~/.ssh/digitalocean root@<your-droplet-ip>
cat /home/user/dwp-ai/deploy/.env
```

**Restart the service manually:**
```bash
ssh -i ~/.ssh/digitalocean root@<your-droplet-ip>
pkill -f "bun.*src/server/index.ts"
cd /home/user/dwp-ai/deploy
nohup bun run src/server/index.ts > server.log 2>&1 &
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DIGITALOCEAN_HOST` | ✅ | - | Droplet IP or hostname |
| `DIGITALOCEAN_USER` | ✅ | - | SSH user |
| `DIGITALOCEAN_SSH_KEY` | ✅ | - | Private SSH key |
| `DIGITALOCEAN_SSH_PORT` | ❌ | `22` | SSH port |
| `DIGITALOCEAN_APP_PATH` | ✅ | - | App deployment path |
| `AI_PROVIDER_URL` | ✅ | - | AI API endpoint |
| `AI_API_KEY` | ✅ | - | AI API key |
| `AI_MODEL` | ❌ | `grok-2-vision-1212` | Vision model name |
| `AI_PROFILE` | ❌ | `general` | Tagging profile |
| `AI_TIMEOUT_MS` | ❌ | `30000` | AI request timeout |
| `UPLOADS_DIR` | ❌ | `/var/data/uploads` | Upload storage path |
| `PORT` | ❌ | `3000` | Server port |

## Rolling Back a Deployment

If something goes wrong, revert the commit on the `live` branch:

```bash
git log origin/live -10  # View recent commits
git revert <commit-sha>  # Revert the problematic commit
git push origin live     # Push revert to trigger redeploy
```

## Advanced: Using a Process Manager

For production, use PM2 or systemd to manage the service:

### Option 1: systemd Service

On your droplet, create `/etc/systemd/system/dwp-ai.service`:

```ini
[Unit]
Description=DWP-AI Photo Search Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/user/dwp-ai/deploy
EnvironmentFile=/home/user/dwp-ai/deploy/.env
ExecStart=/root/.bun/bin/bun run src/server/index.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dwp-ai
sudo systemctl start dwp-ai
sudo systemctl status dwp-ai
```

Then update the deployment script to use systemd instead of `nohup`.

### Option 2: Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Considerations

- Store SSH keys securely in GitHub Secrets
- Use restrictive SSH user permissions
- Consider using a dedicated deployment user instead of `root`
- Enable firewall rules to limit SSH access
- Rotate API keys periodically
- Keep your droplet updated with security patches

## Useful Commands

**View all secrets:**
```bash
gh secret list
```

**Update a single secret:**
```bash
gh secret set VARIABLE_NAME
```

**Remove a secret:**
```bash
gh secret delete VARIABLE_NAME
```

**View workflow runs:**
```bash
gh run list --limit 5
```

**View a specific workflow run:**
```bash
gh run view <run-id> --log
```
