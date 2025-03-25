#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Run the test
echo "Running test..."
NODE_OPTIONS="--no-warnings" node test-document-processing.cjs 