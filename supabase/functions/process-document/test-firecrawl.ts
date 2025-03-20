// @deno-types="https://deno.land/x/types/index.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processWithFirecrawl } from "./index.ts";

// Initialize Supabase client with direct connection
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

// Test function
async function main() {
  try {
    console.log("Starting test with parameters:", {
      documentUrl: "https://autokey.ca",
      documentType: "website_url",
      clientId: "00000000-0000-0000-0000-000000000000",
      agentName: "autokey-agent",
      documentId: crypto.randomUUID(),
      jobId: crypto.randomUUID()
    });

    // First test the Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('document_processing_jobs')
      .select('count')
      .limit(1);

    if (testError) {
      console.error("Supabase connection test failed:", testError);
      return;
    }

    console.log("Supabase connection successful");

    // Create test job
    const documentId = crypto.randomUUID();
    const { data: job, error: jobError } = await supabase
      .from('document_processing_jobs')
      .insert({
        id: crypto.randomUUID(),
        document_url: "https://autokey.ca",
        document_type: "website_url",
        client_id: "00000000-0000-0000-0000-000000000000",
        agent_name: "autokey-agent",
        document_id: documentId,
        processing_method: 'firecrawl',
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create test job:", jobError);
      return;
    }

    console.log("Test job created successfully");

    // Process with Firecrawl
    const result = await processWithFirecrawl(
      supabase,
      job.id,
      "https://autokey.ca",
      "website_url",
      "00000000-0000-0000-0000-000000000000",
      "autokey-agent",
      documentId
    );

    console.log("Test result:", result);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();

// Make this file a module
export {}; 