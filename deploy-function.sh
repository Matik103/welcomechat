#!/bin/bash

# Function name
FUNCTION_NAME="send-client-invitation"

# Project reference from config.toml
PROJECT_REF="mgjodiqecnnltsgorife"

# Create zip file of the function
cd supabase/functions/$FUNCTION_NAME
zip -r ../../../function.zip ./*

# Deploy using curl with verbose output
curl -v -X POST "https://api.supabase.com/rest/v1/functions/${PROJECT_REF}/${FUNCTION_NAME}/deploy" \
  -H "apikey: ${SUPABASE_ACCESS_TOKEN}" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -F "file=@../../../function.zip"

# Clean up
cd ../../../
rm function.zip 