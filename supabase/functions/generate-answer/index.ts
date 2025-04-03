
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { query, context, clientId } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No query provided for answer generation' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!context) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No context documents provided for answer generation' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize OpenAI (safely on the server)
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    console.log(`Generating answer for query: "${query}" for client ${clientId}`);
    
    // Generate answer using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modern model that's cost-effective
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that generates answers based only on the provided context. 
          If the context doesn't contain information to answer the question, admit you don't know rather than making up information.
          Provide specific, concise, and accurate answers based solely on the provided context.`
        },
        {
          role: 'user',
          content: `Context information is below:
          ----------------
          ${context}
          ----------------
          Given the context information and not prior knowledge, answer the following question: ${query}`
        }
      ],
      temperature: 0.3, // Lower temperature for more focused answers
      max_tokens: 600,
    });

    if (!response.choices || response.choices.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No response generated from OpenAI' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const answer = response.choices[0].message.content;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        answer
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-answer function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error in generate-answer function' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
