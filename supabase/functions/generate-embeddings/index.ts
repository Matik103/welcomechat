
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { OpenAI } from "https://esm.sh/openai@4.17.0";

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
    const { text, clientId, documentId } = await req.json();
    
    if (!text || text.trim() === '') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No text provided for embedding generation' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize OpenAI (safely on the server)
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    console.log(`Generating embedding for document ${documentId} (text length: ${text.length})`);
    
    // Generate embedding
    const cleanedText = text.trim().replace(/\n+/g, ' ').slice(0, 8000);
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: cleanedText,
    });

    if (!response.data || response.data.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No embedding data returned from OpenAI' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const embedding = response.data[0].embedding;
    
    // If clientId and documentId are provided, store the embedding
    if (clientId && documentId) {
      // Initialize Supabase client with service role key
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Call RPC function to store embedding
      const { data, error } = await supabaseAdmin.rpc('store_document_embedding', {
        p_client_id: clientId,
        p_document_id: documentId,
        p_content: cleanedText,
        p_embedding: embedding
      });
      
      if (error) {
        console.error('Error storing embedding:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Error storing embedding: ${error.message}` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log('Embedding stored successfully');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        embedding: embedding 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-embeddings function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error in generate-embeddings function' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
