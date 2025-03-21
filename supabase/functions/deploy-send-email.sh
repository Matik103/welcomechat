
#!/bin/bash

# Deploy the send-email function with improved error handling
# Usage: ./deploy-send-email.sh

set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📤 Starting deployment of send-email function..."
echo "📂 Current directory: $(pwd)"

# Check if the send-email directory exists
if [ ! -d "send-email" ]; then
  echo "❌ Error: send-email directory not found!"
  exit 1
fi

# Verify the index.ts file exists
if [ ! -f "send-email/index.ts" ]; then
  echo "❌ Error: send-email/index.ts file not found!"
  exit 1
fi

echo "🔍 Verifying environment variables..."
# Test for Resend API key (don't display the actual key)
if [ -z "$RESEND_API_KEY" ]; then
  echo "⚠️ Warning: RESEND_API_KEY environment variable not set in current shell"
  echo "   The function will use the value stored in Supabase secrets"
else
  echo "✅ RESEND_API_KEY environment variable is set in current shell"
fi

echo "🚀 Deploying send-email function..."
supabase functions deploy send-email --no-verify-jwt

# Check deployment success
if [ $? -eq 0 ]; then
  echo "✅ Deployed send-email function successfully!"
  echo "🌐 Function URL: https://mgjodiqecnnltsgorife.supabase.co/functions/v1/send-email"
else
  echo "❌ Deployment failed. Please check the error message above."
  exit 1
fi

echo "ℹ️ Testing if function is accessible..."
curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "https://mgjodiqecnnltsgorife.supabase.co/functions/v1/send-email" | grep -q "204"
if [ $? -eq 0 ]; then
  echo "✅ Function OPTIONS request returns 204 - CORS is properly configured!"
else
  echo "⚠️ Function may not be accessible via OPTIONS request. Check CORS configuration."
fi

echo "✅ Deployment process completed!"
