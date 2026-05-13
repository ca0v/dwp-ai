#!/bin/bash

# Setup GitHub Secrets for DigitalOcean Deployment
# This script guides you through configuring all required secrets for automated deployment

set -e

REPO_URL=$(git config --get remote.origin.url)
REPO_OWNER=$(echo "$REPO_URL" | sed -E 's/.*github\.com[/:]+([^/]+)\/.*/\1/')
REPO_NAME=$(echo "$REPO_URL" | sed -E 's/.*github\.com[/:]+[^/]+\/(.+)(\.git)?$/\1/')

echo "========================================"
echo "GitHub Secrets Setup for DigitalOcean"
echo "========================================"
echo ""
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo ""
echo "This script will help you set up all required GitHub secrets."
echo "You'll need to have the GitHub CLI (gh) installed and authenticated."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "📋 Required Secrets:"
echo ""
echo "1. DIGITALOCEAN_HOST - Your DigitalOcean droplet IP or hostname"
echo "2. DIGITALOCEAN_USER - SSH user (usually 'root' or your user)"
echo "3. DIGITALOCEAN_SSH_KEY - Your private SSH key (multiline)"
echo "4. DIGITALOCEAN_SSH_PORT - SSH port (default: 22, optional)"
echo "5. DIGITALOCEAN_APP_PATH - Path where app deploys (e.g., /home/user/dwp-ai)"
echo "6. AI_PROVIDER_URL - AI API endpoint (e.g., https://api.xai.com/v1)"
echo "7. AI_API_KEY - Your AI API key"
echo "8. AI_MODEL - AI model name (optional, default: grok-2-vision-1212)"
echo "9. AI_PROFILE - AI profile (optional, default: general)"
echo "10. AI_TIMEOUT_MS - AI timeout in ms (optional, default: 30000)"
echo "11. UPLOADS_DIR - Upload directory path (optional, default: /var/data/uploads)"
echo "12. PORT - Server port (optional, default: 3000)"
echo ""
echo "--------------------------------------"
echo ""

# Function to read sensitive input
read_secret() {
    local prompt=$1
    local var_name=$2
    echo -n "$prompt: "
    read -s value
    echo ""

    if [ -z "$value" ]; then
        echo "⚠️  Skipped (empty input)"
        return 1
    fi

    echo "$var_name=$value"
    return 0
}

# Function to read regular input
read_input() {
    local prompt=$1
    local default=$2
    echo -n "$prompt"
    if [ -n "$default" ]; then
        echo -n " (default: $default): "
    else
        echo -n ": "
    fi
    read value

    if [ -z "$value" ] && [ -n "$default" ]; then
        value="$default"
    fi

    if [ -z "$value" ]; then
        echo "⚠️  Skipped (empty input)"
        return 1
    fi

    echo "$value"
    return 0
}

# Collect secrets
declare -A secrets

echo "📝 Enter your DigitalOcean Configuration:"
echo ""

if value=$(read_input "DigitalOcean Host (IP/hostname)"); then
    secrets["DIGITALOCEAN_HOST"]=$value
fi

if value=$(read_input "DigitalOcean User"); then
    secrets["DIGITALOCEAN_USER"]=$value
fi

if value=$(read_input "DigitalOcean SSH Port" "22"); then
    secrets["DIGITALOCEAN_SSH_PORT"]=$value
fi

if value=$(read_input "Application Deploy Path (e.g., /home/user/dwp-ai)"); then
    secrets["DIGITALOCEAN_APP_PATH"]=$value
fi

echo ""
echo "📝 Enter your SSH Private Key (paste and press Ctrl+D when done):"
echo "Note: Paste your entire private key including -----BEGIN PRIVATE KEY----- header"
echo ""
ssh_key=""
while IFS= read -r line; do
    ssh_key="$ssh_key$line"$'\n'
done
if [ -n "$(echo "$ssh_key" | tr -d '[:space:]')" ]; then
    secrets["DIGITALOCEAN_SSH_KEY"]="$ssh_key"
fi

echo ""
echo "📝 Enter your AI Configuration:"
echo ""

if value=$(read_input "AI Provider URL (e.g., https://api.xai.com/v1)"); then
    secrets["AI_PROVIDER_URL"]=$value
fi

if value=$(read_secret "AI API Key" "AI_API_KEY"); then
    secrets["AI_API_KEY"]=$value
fi

if value=$(read_input "AI Model Name" "grok-2-vision-1212"); then
    secrets["AI_MODEL"]=$value
fi

if value=$(read_input "AI Profile" "general"); then
    secrets["AI_PROFILE"]=$value
fi

if value=$(read_input "AI Timeout (ms)" "30000"); then
    secrets["AI_TIMEOUT_MS"]=$value
fi

if value=$(read_input "Uploads Directory" "/var/data/uploads"); then
    secrets["UPLOADS_DIR"]=$value
fi

if value=$(read_input "Server Port" "3000"); then
    secrets["PORT"]=$value
fi

echo ""
echo "========================================"
echo "Setting GitHub Secrets..."
echo "========================================"
echo ""

# Set secrets in GitHub
for key in "${!secrets[@]}"; do
    echo "Setting $key..."
    gh secret set "$key" -b "${secrets[$key]}" --repo "$REPO_OWNER/$REPO_NAME"
done

echo ""
echo "✅ GitHub secrets configured successfully!"
echo ""
echo "📝 Summary of configured secrets:"
gh secret list --repo "$REPO_OWNER/$REPO_NAME"
echo ""
echo "Next steps:"
echo "1. Push your changes to the 'live' branch"
echo "2. The workflow will automatically trigger and deploy to DigitalOcean"
echo "3. Check GitHub Actions tab to monitor the deployment"
echo ""
