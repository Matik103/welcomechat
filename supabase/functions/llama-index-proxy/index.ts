
import { corsHeaders } from '../_shared/cors.ts';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '../_shared/config.ts';

// Updated API endpoint for LlamaIndex Cloud
const LLAMA_CLOUD_API_URL = 'https://api.cloud.llamaindex.ai';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
      },
    });
  }

  try {
    // Parse the request URL to determine which LlamaIndex endpoint to call
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const endpoint = pathSegments[pathSegments.length - 1]; // Get the last segment
    
    // Log the request details for debugging
    console.log(`Processing LlamaIndex request for endpoint: ${endpoint}`);
    console.log(`Headers: ${JSON.stringify([...req.headers.entries()].map(([k, v]) => `${k}: ${v}`))}`);
    
    // Get authorization header from the request if available
    const authorization = req.headers.get('authorization');
    
    if (endpoint === 'process_file') {
      // Handle file upload to LlamaIndex Cloud
      const formData = await req.formData();
      
      // Set up headers with required API keys and authorization
      const headers = {
        'x-api-key': LLAMA_CLOUD_API_KEY,
      };
      
      // Add OPENAI_API_KEY as Bearer token if authorization not provided
      if (authorization) {
        headers['Authorization'] = authorization;
      } else if (OPENAI_API_KEY) {
        headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
      }
      
      // Forward to LlamaIndex Cloud API using the correct parsing endpoint
      console.log('Sending request to LlamaIndex with headers:', JSON.stringify(headers));
      const llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/api/parsing/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      const data = await llamaResponse.json();
      console.log(`LlamaIndex upload response: ${JSON.stringify(data)}`);
      
      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: llamaResponse.status,
      });
    } else if (url.pathname.includes('/jobs/')) {
      // Handle job status check
      const jobId = url.pathname.split('/jobs/')[1];
      
      // Set up headers with required API key
      const headers = {
        'x-api-key': LLAMA_CLOUD_API_KEY,
        'Content-Type': 'application/json',
      };
      
      // Add authorization if available
      if (authorization) {
        headers['Authorization'] = authorization;
      }
      
      const llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/api/parsing/jobs/${jobId}`, {
        method: 'GET',
        headers,
      });
      
      const data = await llamaResponse.json();
      console.log(`LlamaIndex job status response for ${jobId}: ${JSON.stringify(data)}`);
      
      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: llamaResponse.status,
      });
    }
    
    // Default error for unsupported endpoints
    return new Response(JSON.stringify({ error: 'Unsupported endpoint' }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 400,
    });
  } catch (error) {
    console.error(`Error in llama-index-proxy: ${error.message}`);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});
