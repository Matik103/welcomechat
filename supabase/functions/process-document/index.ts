
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LLAMA_CLOUD_API_KEY = Deno.env.get('LLAMA_CLOUD_API_KEY');
    
    if (!LLAMA_CLOUD_API_KEY) {
      console.error("No LlamaIndex API key found in environment variables");
      return new Response(
        JSON.stringify({ success: false, error: "LlamaIndex API key is required but not found" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request body format" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { fileContent, fileName, clientId, agentName } = requestData;
    
    if (!fileContent) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing file content" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!fileName) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing file name" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!clientId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing client ID" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!agentName) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing agent name" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing document: ${fileName} for client: ${clientId} with agent: ${agentName}`);

    // Call the LlamaIndex API
    const llamaEndpoint = 'https://api.cloud.llamaindex.ai/api/parsing';
    console.log(`Calling LlamaIndex API at: ${llamaEndpoint}`);
    
    try {
      const llamaResponse = await fetch(llamaEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`
        },
        body: JSON.stringify({
          file_name: fileName,
          file_content: fileContent,
          extract_all: true
        })
      });
      
      if (!llamaResponse.ok) {
        const errorText = await llamaResponse.text();
        console.error("LlamaIndex API error:", errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `LlamaIndex API error: ${llamaResponse.status} - ${errorText}` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      const extractionResult = await llamaResponse.json();
      console.log("LlamaIndex extraction completed successfully");
      
      // Extract the text from the response
      const extractedText = extractionResult.text || "No text was extracted";
      
      // Return the extracted text
      return new Response(
        JSON.stringify({ 
          success: true, 
          extractedText,
          processed: 1,
          failed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      console.error("Error calling LlamaIndex API:", fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error calling LlamaIndex API: ${fetchError.message || "Unknown error"}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in process-document function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error occurred" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
