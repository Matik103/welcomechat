#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# RapidAPI configuration
RAPIDAPI_KEY="109e60ef56msh033c6355bf5052cp149673jsnec27c0641c4d"
RAPIDAPI_HOST="pdf-to-text-converter.p.rapidapi.com"

# Create test directory
mkdir -p test-assets

# Generate a large block of Lorem Ipsum text for content padding
generate_lorem_ipsum() {
    cat << 'EOF'
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor.

Sed lectus. Donec mollis hendrerit risus. Phasellus nec sem in justo pellentesque facilisis. Etiam imperdiet imperdiet orci. Nunc nec neque. Phasellus leo dolor, tempus non, auctor et, hendrerit quis, nisi. Curabitur ligula sapien, tincidunt non, euismod vitae, posuere imperdiet, leo. Maecenas malesuada.

In hac habitasse platea dictumst. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia. Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris.
EOF
}

# Function to generate a large PDF
generate_large_pdf() {
    local output_file="test-assets/large-test.pdf"
    echo -e "${YELLOW}Generating large test PDF...${NC}"
    
    # Create base content template
    cat > "test-assets/base-content.txt" << 'EOF'
CHAPTER NUMBER
=============

This is chapter CHAPTER_NUM of the test document.
Document ID: DOCUMENT_ID
Generated: TIMESTAMP

EOF
    
    # Create the main content file
    echo "Large Test Document" > "test-assets/content.txt"
    echo "==================" >> "test-assets/content.txt"
    echo "" >> "test-assets/content.txt"
    
    # Generate 500 chapters with substantial content each
    for ((i=1; i<=500; i++)); do
        # Add chapter header
        sed "s/CHAPTER NUMBER/Chapter $i/g" "test-assets/base-content.txt" | \
        sed "s/CHAPTER_NUM/$i/g" | \
        sed "s/DOCUMENT_ID/$(openssl rand -hex 8)/g" | \
        sed "s/TIMESTAMP/$(date)/g" >> "test-assets/content.txt"
        
        # Add Lorem Ipsum content (multiple times to increase size)
        for ((j=1; j<=10; j++)); do
            generate_lorem_ipsum >> "test-assets/content.txt"
            echo "" >> "test-assets/content.txt"
        done
        
        # Add page break
        echo "" >> "test-assets/content.txt"
        echo "----------------------------------------" >> "test-assets/content.txt"
        echo "" >> "test-assets/content.txt"
        
        # Show progress every 50 chapters
        if ((i % 50 == 0)); then
            echo -e "${GREEN}Generated $i chapters...${NC}"
        fi
    done
    
    echo -e "${YELLOW}Converting to PDF...${NC}"
    
    # Convert to PDF with optimal settings for large documents
    enscript --margins=36:36:36:36 \
            --font=Courier10 \
            --header='$n|Page $% of $=|$D{%Y-%m-%d %H:%M}' \
            --media=A4 \
            --word-wrap \
            --no-job-header \
            -o "test-assets/temp.ps" "test-assets/content.txt"
            
    ps2pdf -dPDFSETTINGS=/ebook \
           -dAutoRotatePages=/None \
           -dCompatibilityLevel=1.4 \
           "test-assets/temp.ps" "$output_file"
    
    # Clean up temporary files
    rm "test-assets/base-content.txt" "test-assets/content.txt" "test-assets/temp.ps"
    
    local actual_size=$(stat -f%z "$output_file")
    echo -e "${GREEN}Generated PDF size: $(echo "scale=2; $actual_size/1048576" | bc)MB${NC}"
    
    return 0
}

# Function to test PDF conversion
test_pdf_conversion() {
    local file=$1
    local file_size=$(stat -f%z "$file")
    local file_size_mb=$(echo "scale=2; $file_size/1048576" | bc)
    
    echo -e "\n${YELLOW}Testing PDF conversion for: $(basename "$file")${NC}"
    echo -e "File size: ${file_size_mb}MB"
    
    # Test direct API call
    echo -e "\n${YELLOW}Sending request to RapidAPI...${NC}"
    local start_time=$(date +%s)
    
    local response=$(curl --request POST \
        --url "https://${RAPIDAPI_HOST}/api/pdf-to-text/convert" \
        --header "X-RapidAPI-Key: ${RAPIDAPI_KEY}" \
        --header "X-RapidAPI-Host: ${RAPIDAPI_HOST}" \
        --form "file=@$file" \
        --write-out "\nHTTP_CODE: %{http_code}\nTIME_TOTAL: %{time_total}\n" \
        --output "test-assets/$(basename "$file" .pdf)_response.txt")
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Parse response metrics
    local http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d' ' -f2)
    local time_total=$(echo "$response" | grep "TIME_TOTAL:" | cut -d' ' -f2)
    
    # Check response
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}Conversion successful${NC}"
        echo -e "Processing time: ${duration} seconds"
        
        # Quick content verification
        local response_file="test-assets/$(basename "$file" .pdf)_response.txt"
        local text_lines=$(wc -l < "$response_file")
        echo -e "Extracted ${text_lines} lines of text"
        
        # Show brief sample
        echo -e "\n${YELLOW}Sample content from first chapter:${NC}"
        head -n 10 "$response_file"
        echo -e "\n${YELLOW}Sample content from middle:${NC}"
        sed -n '25000,25010p' "$response_file" 2>/dev/null || echo "File shorter than expected"
        echo -e "\n${YELLOW}Sample content from last chapter:${NC}"
        tail -n 10 "$response_file"
        
        echo -e "\n${GREEN}Test completed successfully${NC}"
    else
        echo -e "${RED}Conversion failed with HTTP code: $http_code${NC}"
    fi
}

echo -e "${YELLOW}Starting large PDF generation and conversion test...${NC}"

# Generate and test large PDF
generate_large_pdf
test_pdf_conversion "test-assets/large-test.pdf"

echo -e "\n${GREEN}Test completed${NC}" 