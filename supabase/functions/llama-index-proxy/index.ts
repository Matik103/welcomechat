
import { corsHeaders } from '../_shared/cors.ts';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '../_shared/config.ts';

// Updated API endpoint for LlamaIndex Cloud
const LLAMA_CLOUD_API_URL = 'https://api.cloud.llamaindex.ai/api/parsing';

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
    
    // Get x-api-key header for LlamaIndex API
    const apiKey = req.headers.get('x-api-key') || LLAMA_CLOUD_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LlamaIndex API key is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    if (endpoint === 'process_file') {
      // Handle file upload to LlamaIndex Cloud
      const formData = await req.formData();
      
      // Set up headers with required API keys and authorization
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
      };
      
      // Forward to LlamaIndex Cloud API using the correct parsing endpoint
      console.log('Sending request to LlamaIndex with headers:', JSON.stringify(headers));
      const llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/upload`, {
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
      // Extract job ID from the URL path
      const parts = url.pathname.split('/jobs/');
      if (parts.length < 2) {
        return new Response(JSON.stringify({ error: 'Invalid job ID' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      
      // Handle different job-related endpoints
      const jobPath = parts[1];
      const jobId = jobPath.split('/')[0]; // Get job ID before any additional segments
      
      // Set up headers with required API key
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      
      // Check if this is a job status request or content request
      if (jobPath.includes('/content')) {
        // Get job content (markdown results)
        const llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/job/${jobId}/result/markdown`, {
          method: 'GET',
          headers,
        });
        
        if (!llamaResponse.ok) {
          console.error(`Error getting content for job ${jobId}:`, llamaResponse.status);
          return new Response(JSON.stringify({ 
            error: `Failed to get content: ${llamaResponse.statusText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: llamaResponse.status,
          });
        }
        
        const textContent = await llamaResponse.text();
        console.log(`Retrieved content for job ${jobId}, length: ${textContent.length} characters`);
        
        return new Response(textContent, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/markdown',
          },
        });
      } else {
        // Get job status
        const llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/job/${jobId}`, {
          method: 'GET',
          headers,
        });
        
        if (!llamaResponse.ok) {
          console.error(`Error getting job status for ${jobId}:`, llamaResponse.status);
          return new Response(JSON.stringify({ 
            error: `Failed to get job status: ${llamaResponse.statusText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: llamaResponse.status,
          });
        }
        
        const data = await llamaResponse.json();
        console.log(`Job status for ${jobId}:`, JSON.stringify(data));
        
        // If includeContent parameter is present and job is completed, also fetch content
        if (url.searchParams.has('includeContent') && data.status === 'completed') {
          try {
            const contentResponse = await fetch(`${LLAMA_CLOUD_API_URL}/job/${jobId}/result/markdown`, {
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
        });
      }
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
