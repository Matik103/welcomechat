#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it first."
    exit 1
fi

# Deploy database migrations
echo "Deploying database migrations..."
supabase db push

# Deploy Edge Functions
echo "Deploying Edge Functions..."

functions=(
    "upload-file-to-openai"
    "query-openai-assistant"
)

for func in "${functions[@]}"; do
    echo "Deploying $func..."
    supabase functions deploy "$func"
    echo "$func deployed successfully"
done

echo "Setting up secrets..."
supabase secrets set \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    RATE_LIMIT_REQUESTS="100" \
    RATE_LIMIT_WINDOW="60" \
    MAX_FILE_SIZE="10485760"

echo "Deployment completed successfully!" 