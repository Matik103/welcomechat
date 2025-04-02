
import { corsHeaders } from '../_shared/cors.ts';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '../_shared/config.ts';

const LLAMA_CLOUD_API_URL = 'https://cloud.llamaindex.ai/api/v1';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
    });
  }

  try {
    // Parse the request URL to determine which LlamaIndex endpoint to call
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const endpoint = pathSegments[pathSegments.length - 1]; // Get the last segment
    
    if (endpoint === 'process_file') {
      // Handle file upload to LlamaIndex Cloud
      const formData = await req.formData();
      
      // Forward to LlamaIndex Cloud API
      const llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/process_file`, {
        method: 'POST',
        headers: {
          'x-api-key': LLAMA_CLOUD_API_KEY,
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: formData,
      });
      
      const data = await llamaResponse.json();
      
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
      
      const llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'x-api-key': LLAMA_CLOUD_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await llamaResponse.json();
      
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
