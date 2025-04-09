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

# Create a large test PDF file with complex content
echo "Creating large test content..."
cat << 'EOF' > test.txt
Large PDF Document Test
======================

Executive Summary
----------------
This is a comprehensive test document designed to verify the PDF text extraction capabilities of our system. It includes various types of content and formatting to ensure robust extraction.

1. Introduction
--------------
1.1 Purpose
This document serves as a test case for our PDF processing system. It contains multiple sections, lists, and formatted text to simulate real-world documents.

1.2 Scope
The test covers:
- Basic text extraction
- Multi-line content
- Special characters
- Numbers and symbols
- Formatted text

2. Technical Details
-------------------
2.1 System Requirements
• Processing capability: High
• Memory usage: Optimized
• Response time: < 2 seconds

2.2 Test Cases
[Test Case 1]
Input: PDF document
Output: Extracted text
Status: Testing

[Test Case 2]
Input: Large content
Output: Formatted text
Status: Verification

3. Sample Data
-------------
3.1 Text Examples
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

3.2 Special Characters
• Em dash — and en dash –
• Quotes "double" and 'single'
• Symbols: ©®™
• Numbers: 12,345.67
• Currency: $100.00, €50.00, ¥500

4. Formatting Tests
------------------
4.1 Lists
1. First item
   a. Sub-item one
   b. Sub-item two
2. Second item
   - Bullet point
   - Another point
3. Third item

4.2 Tables (Text Format)
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Test A   | Test B   | Test C   |

5. Complex Content
-----------------
5.1 Code Snippet
function testFunction() {
    console.log("Testing PDF extraction");
    return true;
}

5.2 Mathematical Expressions
E = mc²
(a + b)² = a² + 2ab + b²
∑(x_i) from i=1 to n

6. Additional Test Data
----------------------
6.1 Random Text
The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!

6.2 Numbers and Calculations
• Binary: 1010 1111 0000
• Hex: 0xAF40
• Decimal: 44,864
• Percentage: 87.5%

7. Conclusion
------------
This test document includes various types of content to verify the extraction capabilities of our PDF processing system. The successful processing of this document will indicate robust text extraction functionality.

EOF

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

# Create a temporary file for the curl output
CURL_OUTPUT=$(mktemp)

# Send the request with the PDF file
curl -s --request POST \
  --url 'https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert' \
  --header "x-rapidapi-host: $VITE_RAPIDAPI_HOST" \
  --header "x-rapidapi-key: $VITE_RAPIDAPI_KEY" \
  --form "file=@test.pdf;type=application/pdf" \
  --output "$CURL_OUTPUT"

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
      \"size\": $(stat -f%z test.pdf),
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