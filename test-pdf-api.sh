#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Debug output
echo "Debug: Environment variables"
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY: $VITE_SUPABASE_ANON_KEY"
echo "VITE_RAPIDAPI_HOST: $VITE_RAPIDAPI_HOST"
echo "VITE_RAPIDAPI_KEY: $VITE_RAPIDAPI_KEY"

# Verify required environment variables
if [ -z "$VITE_RAPIDAPI_KEY" ] || [ -z "$VITE_RAPIDAPI_HOST" ]; then
  echo "Error: RapidAPI credentials not set in environment"
  exit 1
fi

# Sign in to Supabase
echo "Signing in to Supabase..."
AUTH_RESPONSE=$(curl -s -X POST "$VITE_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1743748343524@example.com",
    "password": "testpassword123"
  }')

ACCESS_TOKEN=$(echo $AUTH_RESPONSE | jq -r '.access_token')
if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "Failed to authenticate with Supabase"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "Successfully authenticated with Supabase"

# Create a large test PDF file
echo "Creating large test content..."

# Create test content with a single section first
cat << 'EOF' > test_section.txt
1. Regular Text
   This is a test section of the document. It contains regular text with numbers like 12,345.67 
   and special characters like © ® ™ — – " ' 

2. Lists and Formatting
   • Item 1 with symbols: ∑ π ∆ ≤ ≥
   • Item 2 with currency: $100.00, €50.00, ¥500
   • Item 3 with math: E = mc², (x + y)² = x² + 2xy + y²

3. Technical Content
   function example() {
       console.log("Testing section");
       return Math.pow(2, 10);
   }

4. Table Example
   | ID | Name   | Value  |
   |----|--------|--------|
   | 1  | Test 1 | $100   |

5. Lorem Ipsum
   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt 
   ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation 
   ullamco laboris nisi ut aliquip ex ea commodo consequat.

----------------------------------------
EOF

# Create the main document
echo "LARGE PDF TEST DOCUMENT" > test.txt
echo "======================" >> test.txt
echo "" >> test.txt
echo "This is a large test document containing repeated sections to verify PDF text extraction capabilities." >> test.txt
echo "Each section contains various types of content including special characters, formatting, and symbols." >> test.txt
echo "" >> test.txt

# Add multiple copies of the section
for i in {1..50}; do
    echo "Section $i" >> test.txt
    echo "----------" >> test.txt
    echo "" >> test.txt
    cat test_section.txt >> test.txt
    echo "" >> test.txt
done

rm test_section.txt

echo "Creating PDF from text..."
cupsfilter test.txt > test.pdf

echo "Created test PDF file"
echo "PDF file size: $(stat -f%z test.pdf) bytes"

# Generate UUIDs
DOCUMENT_ID=$(uuidgen)
CLIENT_ID=$(uuidgen)
FILENAME="test.pdf"
FILE_TYPE="application/pdf"

echo "Using Client ID: $CLIENT_ID"
echo "Using Document ID: $DOCUMENT_ID"

# Extract text using RapidAPI
echo "Sending request to RapidAPI..."

# Create temporary file
CURL_OUTPUT=$(mktemp)

# Send the request with the PDF file and capture verbose output
curl -v --request POST \
  --url "https://$VITE_RAPIDAPI_HOST/api/pdf-to-text/convert" \
  --header "Content-Type: multipart/form-data" \
  --header "x-rapidapi-host: $VITE_RAPIDAPI_HOST" \
  --header "x-rapidapi-key: $VITE_RAPIDAPI_KEY" \
  -F "file=@test.pdf" \
  --output "$CURL_OUTPUT" 2>&1

echo "Curl verbose output:"
cat "$CURL_OUTPUT"

# Read the response
EXTRACTED_TEXT=$(cat "$CURL_OUTPUT")
rm "$CURL_OUTPUT"

echo "RapidAPI Response (raw):"
echo "$EXTRACTED_TEXT"

# Debug the response
echo "Response type:"
echo "$EXTRACTED_TEXT" | file -
echo "Response length:"
echo "$EXTRACTED_TEXT" | wc -c

if [ -z "$EXTRACTED_TEXT" ]; then
  echo "Error: No text extracted from PDF"
  exit 1
fi

# Get file size in a cross-platform way
FILE_SIZE=$(wc -c < test.pdf)

echo "Extracted text length: ${#EXTRACTED_TEXT} characters"
echo "First 200 characters of extracted text:"
echo "$EXTRACTED_TEXT" | head -c 200
echo -e "\n..."
echo "Last 200 characters of extracted text:"
echo "$EXTRACTED_TEXT" | tail -c 200

# Save to Supabase
echo "Saving to database..."
SUPABASE_RESPONSE=$(curl -s -X POST "$VITE_SUPABASE_URL/rest/v1/document_content" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"client_id\": \"$CLIENT_ID\",
    \"document_id\": \"$DOCUMENT_ID\",
    \"content\": $(echo "$EXTRACTED_TEXT" | jq -R -s .),
    \"filename\": \"$FILENAME\",
    \"file_type\": \"$FILE_TYPE\",
    \"metadata\": {
      \"filename\": \"$FILENAME\",
      \"file_type\": \"$FILE_TYPE\",
      \"size\": $FILE_SIZE,
      \"uploadedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
      \"processing_status\": \"extraction_complete\",
      \"extraction_method\": \"rapidapi\",
      \"text_length\": ${#EXTRACTED_TEXT},
      \"extracted_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }
  }")

echo "Supabase Response:"
echo "$SUPABASE_RESPONSE" | jq '.' || echo "$SUPABASE_RESPONSE"

# Verify the saved content
echo "Verifying saved content..."
VERIFY_RESPONSE=$(curl -s -X GET "$VITE_SUPABASE_URL/rest/v1/document_content?document_id=eq.$DOCUMENT_ID" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Verification Response:"
echo "$VERIFY_RESPONSE" | jq '.'

# Clean up
rm test.txt test.pdf

echo -e "\nTest completed. Document ID: $DOCUMENT_ID" 