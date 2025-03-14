#!/bin/bash

# Generate a unique test email and temporary password
TIMESTAMP=$(date +%s)
TEST_EMAIL="testadmin${TIMESTAMP}@example.com"
TEST_NAME="Test Admin ${TIMESTAMP}"
TEMP_PASSWORD="Welcome${TIMESTAMP}!"  # Temporary password that admin needs to change
TEST_PASSWORD="$TEMP_PASSWORD"  # Using the same password for initial signup

# Get the service role key from .env.local file (using the more recent key)
SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk1MjY0MDAsImV4cCI6MjAyNTEwMjQwMH0.mYzLVbzMwVmGmPBl2cxVeE6QwnNKuqZVxNqQhWEx5Ow"

echo "Testing admin signup with:"
echo "Email: $TEST_EMAIL"
echo "Name: $TEST_NAME"
echo "Temporary Password: $TEMP_PASSWORD"

# Sign up the admin user
curl -v 'https://mgjodiqecnnltsgorife.supabase.co/auth/v1/signup' \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"data\": {
      \"full_name\": \"$TEST_NAME\",
      \"role\": \"admin\",
      \"needs_password_change\": true
    }
  }"

echo "\n\nWaiting for 2 seconds before sending welcome email...\n"
sleep 2

# Send welcome email with temporary password
curl -v 'https://mgjodiqecnnltsgorife.supabase.co/functions/v1/send-admin-welcome' \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"fullName\": \"$TEST_NAME\",
    \"temporaryPassword\": \"$TEMP_PASSWORD\"
  }" 