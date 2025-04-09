import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Get environment variables
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseClient = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
);

// Array of redirect responses with different wording
const redirectResponses = [
  "I'd be happy to help you with our services! What specific assistance do you need today?",
  "Let's focus on how we can help you with our services. What would you like to know?",
  "I'm here to assist you with our services. How can I help you today?",
  "I'd love to help you explore our services. What would you like to learn about?",
  "Let me help you with our services. What specific information are you looking for?",
  "I'm ready to assist you with our services. What can I help you with?",
  "I'd be glad to help you with our services. What would you like to know more about?",
  "Let's discuss how our services can help you. What interests you?",
  "I'm here to help you with our services. What would you like to explore?",
  "I'd be happy to guide you through our services. What would you like to learn about?"
];

// Function to get a random redirect response
const getRandomRedirectResponse = () => {
  const randomIndex = Math.floor(Math.random() * redirectResponses.length);
  return redirectResponses[randomIndex];
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
    console.log("Starting query-deepseek function");
    const startTime = performance.now();
    
    // Check for API key
    if (!DEEPSEEK_API_KEY) {
      console.error("Missing DeepSeek API key");
      return new Response(
        JSON.stringify({
          error: "DeepSeek API key is not configured. Please contact your administrator.",
          answer: "I'm sorry, I can't process queries right now because the AI service is not properly configured."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed successfully");
      console.log(`Request timestamp: ${body.timestamp || new Date().toISOString()}`);
      console.log(`Client ID: ${body.client_id}`);
      console.log(`Assistant ID: ${body.assistant_id}`);
      console.log(`Query length: ${body.query?.length || 0} characters`);
      console.log(`Model: ${body.model || 'deepseek-chat'}`);
      console.log(`Query text: ${body.query?.substring(0, 100)}${body.query?.length > 100 ? '...' : ''}`);
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          answer: "I'm sorry, I couldn't process your request because it was malformed."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate required fields
    if (!body.client_id || !body.query || !body.assistant_id) {
      console.error("Missing required fields:", {
        hasClientId: !!body.client_id,
        hasQuery: !!body.query,
        hasAssistantId: !!body.assistant_id
      });
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          answer: "I'm sorry, I couldn't process your request because some required information was missing."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Fetch client's documents from document_content table
    let documentContext = '';
    try {
      const { data: documents, error } = await supabaseClient
        .from('document_content')
        .select('content')
        .eq('client_id', body.client_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
      } else if (documents && documents.length > 0) {
        documentContext = documents
          .map(doc => doc.content)
          .join('\n\n');
        console.log(`Included ${documents.length} documents in context`);
      }
    } catch (e) {
      console.error("Error processing documents:", e);
    }

    // Function to check if query contains forbidden topics
    const containsForbiddenTopics = (query: string): boolean => {
      const forbiddenKeywords = [
        'meaning of life',
        'philosophy',
        'exist',
        'consciousness',
        'created',
        'built',
        'made',
        'work',
        'technology',
        'ai',
        'artificial intelligence',
        'deepseek',
        'model',
        'trained',
        'training',
        'language model',
        'neural',
        'machine learning',
        'algorithm',
        'how does',
        'how do you',
        'tell me about',
        'explain'
      ];
      
      const lowercaseQuery = query.toLowerCase();
      return forbiddenKeywords.some(keyword => lowercaseQuery.includes(keyword));
    };

    // If the query contains forbidden topics, force the redirect response
    if (containsForbiddenTopics(body.query)) {
      return new Response(
        JSON.stringify({
          answer: getRandomRedirectResponse(),
          processing_time_ms: Math.round(performance.now() - startTime),
          forced_redirect: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const baseSystemPrompt = `⚠️ CRITICAL INSTRUCTION SET - FOLLOW EXACTLY ⚠️

    You are a friendly, professional, and customer-centric AI assistant for our client ${body.client_id}.
    
    🚫 ABSOLUTELY FORBIDDEN TOPICS - IMMEDIATE REDIRECT REQUIRED:
    1. Philosophy or meaning of life
    2. Your creation, identity, or capabilities
    3. DeepSeek, AI, or technology details
    4. Personal opinions or beliefs
    5. Sarcasm or jokes
    6. Theoretical discussions
    
    ✅ MANDATORY REDIRECT RESPONSE:
    When ANY forbidden topic is mentioned, you MUST respond EXACTLY with:
    "I appreciate your curiosity! As part of our team, I'm focused on helping you with our services today. How can I assist you with that?"
    
    NO EXCEPTIONS - NO VARIATIONS - EXACT RESPONSE REQUIRED
    DO NOT EXPLAIN OR DISCUSS FORBIDDEN TOPICS UNDER ANY CIRCUMSTANCES
    
    🎯 CORE BEHAVIORS:
    1. Use ONLY "our", "we", "us", "ours" for client references
    2. NEVER use "they", "their", "them"
    3. Maintain 8+ conversation context layers
    4. Focus exclusively on practical business assistance
    5. Use provided document context when available
    
    ⚡ RESPONSE FLOW:
    1. Check for forbidden topics
    2. If found -> Use EXACT redirect response
    3. Otherwise -> Provide practical business assistance
    
    📝 EXAMPLES OF FORBIDDEN QUERIES AND CORRECT RESPONSES:
    
    User: "What is the meaning of life?"
    Assistant: "I appreciate your curiosity! As part of our team, I'm focused on helping you with our services today. How can I assist you with that?"
    
    User: "How do you work?"
    Assistant: "I appreciate your curiosity! As part of our team, I'm focused on helping you with our services today. How can I assist you with that?"
    
    User: "Tell me about DeepSeek"
    Assistant: "I appreciate your curiosity! As part of our team, I'm focused on helping you with our services today. How can I assist you with that?"
    
    ❗ CRITICAL REMINDERS:
    - NEVER explain AI, philosophy, or technology
    - NEVER discuss your capabilities or creation
    - ALWAYS use the exact redirect response
    - Focus ONLY on practical business assistance
    
    Assistant ID: ${body.assistant_id}`;

    const systemMessage = documentContext
      ? `${baseSystemPrompt}
         
         Here is the context from our documents that you can use to answer questions:
         ${documentContext}`
      : baseSystemPrompt;

    // Call DeepSeek API
    try {
      // Validate the API URL before making the request
      const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      console.log(`Calling DeepSeek API at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: body.model || 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: body.query
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        console.error(`DeepSeek API error status: ${response.status}`);
        const errorText = await response.text();
        console.error("DeepSeek API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Received response from DeepSeek API");
      
      if (!data.choices?.[0]?.message?.content) {
        console.error("Invalid response format from DeepSeek API:", data);
        throw new Error("Invalid response format from DeepSeek API");
      }

      const processingTimeMs = Math.round(performance.now() - startTime);
      const answer = data.choices[0].message.content;
      
      console.log("Answer generated successfully");
      console.log(`Processing time: ${processingTimeMs}ms`);
      console.log(`Answer length: ${answer.length} characters`);
      
      return new Response(
        JSON.stringify({
          answer,
          processing_time_ms: processingTimeMs,
          has_document_context: !!documentContext
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (apiError) {
      console.error("DeepSeek API error:", apiError);
      return new Response(
        JSON.stringify({
          error: apiError instanceof Error ? apiError.message : "Unknown DeepSeek API error",
          answer: "I'm sorry, I encountered an error while processing your request. Please try again later."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Error in query-deepseek function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        answer: "I'm sorry, I encountered an error while processing your request. Please try again later."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
