#!/bin/bash

# Set environment variables
export SUPABASE_URL="https://mgjodiqecnnltsgorife.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is"
export FIRECRAWL_API_KEY="fc-2af48f6162a34e7fb5e47615a80857ca"

# Run the test
deno run --allow-net --allow-read --allow-env test-firecrawl.ts 