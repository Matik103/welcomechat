#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if RAPIDAPI_KEY is set
if [ -z "$RAPIDAPI_KEY" ]; then
    echo -e "${RED}Error: RAPIDAPI_KEY environment variable is not set${NC}"
    exit 1
fi

# Create test directory if it doesn't exist
mkdir -p test-assets

# Generate a large text file with structured content
echo -e "${BLUE}Generating test content...${NC}"
rm -f test-assets/large-content.txt

# Generate content with page markers and structured text
for i in {1..2000}; do
    echo "=== Page $i ===" >> test-assets/large-content.txt
    echo "This is a test page $i of the large PDF document." >> test-assets/large-content.txt
    echo "The content includes various types of text to test extraction:" >> test-assets/large-content.txt
    echo "1. Regular paragraphs with mixed content" >> test-assets/large-content.txt
    echo "2. Numbers and special characters: !@#$%^&*()" >> test-assets/large-content.txt
    echo "3. Technical terms: API, PDF, OCR, Processing" >> test-assets/large-content.txt
    echo "4. URLs: https://example.com/page$i" >> test-assets/large-content.txt
    echo "5. Email addresses: test$i@example.com" >> test-assets/large-content.txt
    echo "" >> test-assets/large-content.txt
    echo "This is a longer paragraph to test how the system handles continuous text. " >> test-assets/large-content.txt
    echo "It includes multiple sentences and various types of content to ensure " >> test-assets/large-content.txt
    echo "proper text extraction and formatting preservation." >> test-assets/large-content.txt
    echo "" >> test-assets/large-content.txt
    echo "Page $i Footer" >> test-assets/large-content.txt
    echo "\f" >> test-assets/large-content.txt # Form feed for page break
done

# Convert text to PDF using enscript and ps2pdf
echo -e "${BLUE}Converting to PDF...${NC}"
enscript -B -o test-assets/large-test.ps test-assets/large-content.txt
ps2pdf test-assets/large-test.ps test-assets/large-test.pdf

# Get file size
PDF_SIZE=$(stat -f %z test-assets/large-test.pdf)
echo -e "${GREEN}Generated PDF size: $PDF_SIZE bytes${NC}"

# Function to test PDF conversion
test_pdf_conversion() {
    local pdf_file=$1
    local start_time=$(date +%s)
    
    echo -e "${BLUE}Testing PDF conversion...${NC}"
    echo -e "${BLUE}File: $pdf_file${NC}"
    echo -e "${BLUE}Size: $PDF_SIZE bytes${NC}"
    
    # Send the request to the API
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "x-rapidapi-host: pdf-to-text-converter.p.rapidapi.com" \
        -H "x-rapidapi-key: $RAPIDAPI_KEY" \
        -H "x-pdf-optimization: high" \
        -H "x-processing-priority: high" \
        -H "x-large-file: true" \
        -F "file=@$pdf_file" \
        -F "optimize=true" \
        -F "ocr=true" \
        -F "language=eng" \
        -F "quality=high" \
        "https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert")
    
    # Get status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Get response body (all but last line)
    response_body=$(echo "$response" | sed \$d)
    
    # Calculate processing time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${BLUE}Processing time: $duration seconds${NC}"
    
    if [ "$status_code" -eq 200 ]; then
        echo -e "${GREEN}Conversion successful!${NC}"
        # Save response to file
        echo "$response_body" > test-assets/response.txt
        # Count pages in response
        pages=$(grep -c "=== Page" test-assets/response.txt)
        echo -e "${GREEN}Extracted $pages pages${NC}"
        # Show preview of first and last pages
        echo -e "${BLUE}Preview of first page:${NC}"
        head -n 10 test-assets/response.txt
        echo "..."
        echo -e "${BLUE}Preview of last page:${NC}"
        tail -n 10 test-assets/response.txt
    else
        echo -e "${RED}Conversion failed with status code: $status_code${NC}"
        echo -e "${RED}Error: $response_body${NC}"
    fi
}

# Test the PDF conversion
test_pdf_conversion "test-assets/large-test.pdf"

# Cleanup temporary files
rm -f test-assets/large-content.txt test-assets/large-test.ps

echo -e "${GREEN}Test completed!${NC}" 