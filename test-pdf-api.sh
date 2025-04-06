#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create a test PDF file using Python
echo "Creating test PDF..."
python3 create_test_pdf.py

# Verify file creation
if [ ! -f test.pdf ]; then
    echo "Error: PDF file was not created"
    exit 1
fi

echo "PDF file created successfully. Size: $(ls -lh test.pdf | awk '{print $5}')"

echo "Testing PDF text extraction API..."

# Make the API request
curl -X POST \
  'https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'x-rapidapi-host: pdf-to-text-converter.p.rapidapi.com' \
  -H 'x-rapidapi-key: 109e60ef56msh033c6355bf5052cp149673jsnec27c0641c4d' \
  -F 'file=@test.pdf' \
  -v

echo -e "\nCleaning up..."
rm test.pdf 