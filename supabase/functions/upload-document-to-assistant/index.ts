
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      console.error("Missing OpenAI API key");
      throw new Error("Server is not configured with OpenAI API key");
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      throw new Error("Server is not configured with Supabase credentials");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client initialized successfully");
    
    // Parse the request body
    const requestData = await req.json();
    const { clientId, agentName, documentContent, documentTitle } = requestData;
    
    console.log("Request data received:", {
      clientId,
      agentName,
      documentTitle,
      contentLength: documentContent?.length || 0
    });
    
    if (!clientId || !documentContent) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: clientId and documentContent are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Get the OpenAI Assistant ID for this client
    const { data: assistantData, error: assistantError } = await supabase
      .from("ai_agents")
      .select("openai_assistant_id")
      .eq("client_id", clientId)
      .eq("interaction_type", "config")
      .single();
    
    if (assistantError || !assistantData?.openai_assistant_id) {
      console.error("No OpenAI Assistant ID found for this client");
      return new Response(
        JSON.stringify({ error: "No OpenAI Assistant configured for this client" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const assistantId = assistantData.openai_assistant_id;
    console.log(`Found OpenAI Assistant ID: ${assistantId}`);
    
    // Step 1: Create a file with the document content
    console.log("Creating file with OpenAI API...");
    const fileResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'multipart/form-data'
      },
      body: JSON.stringify({
        purpose: 'assistants',
        file: new File([documentContent], documentTitle, { type: 'text/plain' })
      })
    });
    
    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error("OpenAI file creation error:", errorText);
      throw new Error(`Failed to create file with OpenAI: ${errorText}`);
    }
    
    const fileData = await fileResponse.json();
    const fileId = fileData.id;
    console.log(`Created file with ID: ${fileId}`);
    
    // Step 2: Attach the file to the OpenAI Assistant
    console.log(`Attaching file to assistant ${assistantId}...`);
    const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        file_id: fileId
      })
    });
    
    if (!attachResponse.ok) {
      const errorText = await attachResponse.text();
      console.error("OpenAI file attachment error:", errorText);
      throw new Error(`Failed to attach file to assistant: ${errorText}`);
    }
    
    const attachData = await attachResponse.json();
    console.log("File attached successfully:", attachData);
    
    // Step 3: Log this activity to the database
    await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "openai_assistant_document_added",
        description: `Document "${documentTitle}" added to OpenAI Assistant`,
        metadata: {
          document_title: documentTitle,
          agent_name: agentName,
          openai_file_id: fileId,
          openai_assistant_id: assistantId,
          content_length: documentContent.length
        }
      });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Document successfully added to OpenAI Assistant",
        file_id: fileId,
        assistant_id: assistantId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Error in upload-document-to-assistant function:", err);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Failed to add document to OpenAI Assistant", 
        details: JSON.stringify(err)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
