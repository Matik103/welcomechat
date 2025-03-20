import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

// Load environment variables from .env file
const env = await config({ path: "./supabase/functions/process-document/.env" });

const SUPABASE_URL = env["SUPABASE_URL"] || Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = env["SUPABASE_ANON_KEY"] || Deno.env.get("SUPABASE_ANON_KEY") || "";

// Test cases for different document types
const testCases = [
  {
    name: "Website URL",
    documentUrl: "https://www.supabase.com/docs",
    documentType: "website_url",
    clientId: "123e4567-e89b-12d3-a456-426614174000",
    agentName: "test-agent",
    documentId: "123e4567-e89b-12d3-a456-426614174001"
  },
  {
    name: "Google Drive URL",
    documentUrl: "https://drive.google.com/file/d/1234567890/view?usp=sharing",
    documentType: "google_drive_url",
    clientId: "123e4567-e89b-12d3-a456-426614174000",
    agentName: "test-agent",
    documentId: "123e4567-e89b-12d3-a456-426614174002"
  },
  {
    name: "PDF File",
    documentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    documentType: "file_upload",
    clientId: "123e4567-e89b-12d3-a456-426614174000",
    agentName: "test-agent",
    documentId: "123e4567-e89b-12d3-a456-426614174003"
  }
];

async function testDocumentProcessing() {
  console.log("Starting document processing tests...\n");
  console.log("Using Supabase URL:", SUPABASE_URL);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required");
    Deno.exit(1);
  }

  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    console.log(`Document URL: ${testCase.documentUrl}`);
    console.log(`Document Type: ${testCase.documentType}`);
    console.log(`Client ID: ${testCase.clientId}`);
    console.log(`Document ID: ${testCase.documentId}`);

    try {
      const functionUrl = `${SUPABASE_URL}/functions/v1/process-document`;
      console.log("Calling function at:", functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(testCase)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log("Response:", JSON.stringify(result, null, 2));
      console.log("----------------------------------------");
    } catch (error) {
      console.error(`Error processing ${testCase.name}:`, error);
      console.log("----------------------------------------");
    }
  }
}

// Run the tests
await testDocumentProcessing(); 