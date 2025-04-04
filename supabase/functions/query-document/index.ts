
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  prompt: string;
  document_id: string;
  assistant_id: string;
  client_id: string;
}

async function getDocumentContent(documentId: number): Promise<string> {
  const { data, error } = await supabase
    .from('document_content')
    .select('content')
    .eq('id', documentId)
    .single();

  if (error) throw new Error(`Failed to fetch document content: ${error.message}`);
  if (!data?.content) throw new Error('Document content not found');

  return data.content;
}

async function checkAssistantAccess(documentId: number, assistantId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('assistant_documents')
    .select('id')
    .eq('document_id', documentId)
    .eq('assistant_id', assistantId)
    .eq('status', 'ready')
    .single();

  if (error) return false;
  return !!data;
}

async function queryOpenAI(systemMessage: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "No response generated";
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("Received request to query document");
    
    const { prompt, document_id, assistant_id, client_id } = await req.json() as RequestBody;
    console.log("Request payload:", { prompt, document_id, assistant_id, client_id });
    
    // Validate required fields
    if (!prompt || !document_id || !assistant_id || !client_id) {
      throw new Error("Missing required fields");
    }

    // Convert document_id to number
    const docId = parseInt(document_id);
    if (isNaN(docId)) {
      throw new Error("Invalid document_id format");
    }

    // Check assistant access
    console.log("Checking assistant access");
    const hasAccess = await checkAssistantAccess(docId, assistant_id);
    if (!hasAccess) {
      throw new Error("Assistant does not have access to this document");
    }

    // Get document content
    console.log("Fetching document content");
    const documentContent = await getDocumentContent(docId);

    // Create system message with document content
    const systemMessage = `You are a helpful assistant. You have access to the following document content:\n\n${documentContent}\n\nPlease answer questions about this document accurately and concisely.`;

    // Query OpenAI
    console.log("Querying OpenAI");
    const response = await queryOpenAI(systemMessage, prompt);
    console.log("Response received from OpenAI");

    return new Response(
      JSON.stringify({
        status: "success",
        response: response
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error("Error processing request:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({
        status: "error",
        message: errorMessage
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
