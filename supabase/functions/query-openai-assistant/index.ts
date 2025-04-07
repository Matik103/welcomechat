
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { OpenAI } from "https://esm.sh/openai@4.28.0";

// Get environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("Starting query-openai-assistant function");
    
    // Check for API key
    if (!OPENAI_API_KEY) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is not configured. Please contact your administrator.",
          answer: "I'm sorry, I can't process queries right now because the AI service is not properly configured."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 but with error info
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed successfully");
    } catch (err) {
      console.error("Error parsing request body:", err);
      throw new Error("Invalid JSON in request body");
    }
    
    const { client_id, query } = body;

    if (!client_id || !query) {
      throw new Error("Missing required fields: client_id and query are required");
    }

    console.log(`Processing query for client_id: ${client_id}`);
    console.log(`Query text: ${query}`);
    
    // Initialize OpenAI with a timeout option
    const openai = new OpenAI({ 
      apiKey: OPENAI_API_KEY,
      timeout: 30000, // 30 second timeout
    });

    try {
      // Start a timer to track performance
      const startTime = performance.now();
      
      // Generate embedding for the query
      console.log("Generating embedding for query...");
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: query.trim(),
      });

      if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
        throw new Error("Failed to generate query embedding");
      }

      const queryEmbedding = embeddingResponse.data[0].embedding;
      console.log("Embedding generated successfully");

      // Search for similar documents
      console.log("Searching for similar documents...");
      const { data: documents, error: searchError } = await supabase.rpc('match_documents_by_embedding', {
        p_client_id: client_id, 
        p_query_embedding: queryEmbedding,
        p_match_threshold: 0.5,
        p_match_count: 5
      });

      if (searchError) {
        console.error("Error searching documents:", searchError);
        throw new Error(`Error searching documents: ${searchError.message}`);
      }

      if (!documents || documents.length === 0) {
        console.log("No relevant documents found for query");
        return new Response(
          JSON.stringify({
            answer: "I don't have any relevant documents to answer your question. Please try uploading some documents first.",
            documents: []
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      console.log(`Found ${documents.length} relevant documents`);

      // Format documents for the prompt
      const documentContext = documents
        .map((doc, index) => `Document ${index + 1}:\n${doc.content}\n`)
        .join("\n");

      // Generate answer using ChatGPT
      console.log("Generating answer using OpenAI...");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that answers questions based on the provided documents. Use only the information from the documents to answer questions. If the documents don't contain relevant information, say so."
          },
          {
            role: "user",
            content: `Documents:\n${documentContext}\n\nQuestion: ${query}\n\nPlease answer the question based on the provided documents.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw new Error("Failed to generate answer");
      }

      console.log("Answer generated successfully");
      
      // Calculate processing time
      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);
      console.log(`Total processing time: ${processingTime}ms`);

      // Log query to database for analytics
      try {
        await supabase.from('assistant_queries').insert({
          client_id,
          query,
          answer: completion.choices[0].message.content,
          success: true,
          processing_time_ms: processingTime
        });
      } catch (logError) {
        console.error("Failed to log query:", logError);
        // Non-critical error, continue with response
      }

      // Return the answer and relevant documents
      return new Response(
        JSON.stringify({
          answer: completion.choices[0].message.content,
          documents: documents.map(doc => ({
            content: doc.content.substring(0, 200) + '...',  // Only return a preview
            similarity: doc.similarity
          })),
          processing_time_ms: processingTime
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      
      // Log failed query to database
      try {
        await supabase.from('assistant_queries').insert({
          client_id,
          query,
          error_message: openaiError instanceof Error ? openaiError.message : "Unknown OpenAI error",
          success: false
        });
      } catch (logError) {
        console.error("Failed to log error query:", logError);
      }
      
      // Fallback to a simple response when OpenAI fails
      return new Response(
        JSON.stringify({
          answer: "I'm having trouble accessing my knowledge base at the moment. Please try again later.",
          error: openaiError instanceof Error ? openaiError.message : "Unknown OpenAI error"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 but include error in payload
        }
      );
    }
  } catch (error) {
    console.error("Error in query-openai-assistant function:", error);
    return new Response(
      JSON.stringify({
        answer: "Sorry, I encountered an error processing your request. Please try again later.",
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 but include error in payload for better user experience
      }
    );
  }
});
