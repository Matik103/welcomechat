
#!/bin/bash

# Deploy all functions or specific functions
# Usage: ./deploy.sh [function-name]

set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to deploy a specific function
deploy_function() {
  local func_name=$1
  echo "Deploying function: $func_name"
  
  if [ -d "$func_name" ]; then
    cd "$func_name"
    supabase functions deploy "$func_name" --no-verify-jwt
    cd ..
    echo "✅ Deployed $func_name"
  else
    echo "❌ Function directory not found: $func_name"
    exit 1
  fi
}

# If a specific function is provided, deploy just that one
if [ $# -eq 1 ]; then
  deploy_function "$1"
else
  # Otherwise, deploy all functions
  for func_dir in */; do
    # Remove trailing slash
    func_name="${func_dir%/}"
    # Skip deploying the config directory if it exists
    if [ "$func_name" != "config" ] && [ "$func_name" != "node_modules" ]; then
      deploy_function "$func_name"
    fi
  done
fi

echo "All functions deployed successfully!"
