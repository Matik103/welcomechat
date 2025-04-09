#!/bin/bash

echo "Testing PDF text extraction API..."

# Make the API request with a direct file upload
curl \
  -F 'file=@./test-assets/small-test.pdf' \
  -H 'Content-Type: multipart/form-data' \
  -H 'x-rapidapi-host: pdf-to-text-converter.p.rapidapi.com' \
  -H 'x-rapidapi-key: 109e60ef56msh033c6355bf5052cp149673jsnec27c0641c4d' \
  'https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert'

echo "Done!" 