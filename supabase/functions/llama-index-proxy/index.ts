
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
    console.log(`URL: ${url.pathname}`);
    console.log(`Headers: ${JSON.stringify([...req.headers.entries()].map(([k, v]) => `${k}: ${v}`))}`);
    
    // Get authorization header from the request if available
    const authorization = req.headers.get('authorization');
    console.log(`Authorization header: ${authorization ? 'Present' : 'Not present'}`);
    
    if (endpoint === 'process_file') {
      // Handle file upload to LlamaIndex Cloud
      const formData = await req.formData();
      
      // Set up headers with required API keys and authorization
      const headers: Record<string, string> = {
        'x-api-key': LLAMA_CLOUD_API_KEY,
      };
      
      // Add authorization from client request or use OPENAI_API_KEY as fallback
      if (authorization) {
        headers['Authorization'] = authorization;
        console.log('Using authorization header from client request');
      } else if (OPENAI_API_KEY) {
        headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
        console.log('Using OPENAI_API_KEY as fallback authorization');
      } else {
        console.log('No authorization header available');
      }
      
      // Forward to LlamaIndex Cloud API using the correct parsing endpoint
      console.log('Sending request to LlamaIndex with headers:', JSON.stringify(headers));
      const llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/api/parsing/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      const responseStatus = llamaResponse.status;
      const data = await llamaResponse.json();
      console.log(`LlamaIndex upload response [${responseStatus}]:`, JSON.stringify(data));
      
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
      const headers: Record<string, string> = {
        'x-api-key': LLAMA_CLOUD_API_KEY,
        'Content-Type': 'application/json',
      };
      
      // Add authorization if available
      if (authorization) {
        headers['Authorization'] = authorization;
        console.log('Using authorization header from client request');
      } else if (OPENAI_API_KEY) {
        headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
        console.log('Using OPENAI_API_KEY as fallback authorization');
      } else {
        console.log('No authorization header available');
      }
      
      const llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/api/parsing/job/${jobId}`, {
        method: 'GET',
        headers,
      });
      
      const responseStatus = llamaResponse.status;
      const data = await llamaResponse.json();
      console.log(`LlamaIndex job status response [${responseStatus}] for ${jobId}:`, JSON.stringify(data));
      
      // If job is completed, also check if we need to get the content
      if (data.status === 'completed' && url.searchParams.has('includeContent')) {
        try {
          const contentResponse = await fetch(`${LLAMA_CLOUD_API_URL}/api/parsing/job/${jobId}/result/markdown`, {
            method: 'GET',
            headers,
          });
          
          if (contentResponse.ok) {
            const content = await contentResponse.text();
            data.parsed_content = content;
            console.log(`Retrieved content for job ${jobId}, length: ${content.length} characters`);
          }
        } catch (contentError) {
          console.error(`Error retrieving content for job ${jobId}:`, contentError);
        }
      }
      
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
