
#!/bin/bash

# Deploy the send-email function
# Usage: ./deploy-send-email.sh

set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Deploying send-email function..."
supabase functions deploy send-email --no-verify-jwt

echo "✅ Deployed send-email function successfully!"
