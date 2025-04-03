/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { corsHeaders } from '../_shared/cors.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Constants
const LLAMA_CLOUD_API_URL = 'https://api.cloud.llamaindex.ai/api/parsing';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const LLAMA_CLOUD_API_KEY = Deno.env.get('LLAMA_CLOUD_API_KEY');

// Helper function to validate file
const validateFile = (file: File): void => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are supported');
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Parse the request URL to determine which LlamaIndex endpoint to call
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const endpoint = pathSegments[pathSegments.length - 1];
    
    console.log(`Processing LlamaIndex request for endpoint: ${endpoint}`);
    
    // Get authorization header
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      throw new Error('No authorization token provided');
    }
    
    if (!LLAMA_CLOUD_API_KEY) {
      throw new Error('LLAMA_CLOUD_API_KEY environment variable is not set');
    }

    if (endpoint === 'process_file') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('No file provided');
      }
      
      validateFile(file);
      
      const headers = {
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
      };
      
      let llamaResponse;
      try {
        llamaResponse = await fetch(`${LLAMA_CLOUD_API_URL}/upload`, {
          method: 'POST',
          headers,
          body: formData,
        });
      } catch (error) {
        console.error('Error calling LlamaIndex API:', error);
        throw new Error(`Network error: ${error.message}`);
      }
      
      // Clone the response before reading it
      const responseClone = llamaResponse.clone();
      
      try {
        const data = await llamaResponse.json();
        
        if (!llamaResponse.ok) {
          throw new Error(data.error || 'Failed to process document');
        }
        
        if (!data.job_id) {
          throw new Error('No job ID received from LlamaIndex');
        }
        
        return new Response(JSON.stringify(data), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        });
      } catch (jsonError) {
        // If JSON parsing fails, try to get the error message from the cloned response
        const errorText = await responseClone.text();
        console.error('Failed to parse LlamaIndex response:', errorText);
        throw new Error(`Failed to process document: ${errorText}`);
      }
    } else if (endpoint.startsWith('jobs/')) {
      // Handle job status checking
      const jobId = endpoint.replace('jobs/', '');
      const includeContent = url.searchParams.get('includeContent') === 'true';
      
      console.log(`Checking job status for job ID: ${jobId}, includeContent: ${includeContent}`);
      
      const headers = {
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
        'Content-Type': 'application/json',
      };
      
      const pollUrl = `${LLAMA_CLOUD_API_URL}/poll/${jobId}`;
      
      let llamaResponse;
      try {
        llamaResponse = await fetch(pollUrl, {
          method: 'GET',
          headers,
        });
      } catch (error) {
        console.error(`Error calling LlamaIndex API for job ${jobId}:`, error);
        throw new Error(`Network error: ${error.message}`);
      }
      
      // Clone the response before reading it
      const responseClone = llamaResponse.clone();
      
      try {
        const data = await llamaResponse.json();
        
        // Process the response to make it compatible with our frontend expectations
        const processedResponse = {
          job_id: jobId,
          status: data.status === 'completed' ? 'SUCCEEDED' : 
                 data.status === 'failed' ? 'FAILED' :
                 data.status === 'processing' ? 'PROCESSING' : 'PENDING',
          parsed_content: data.text || null,
          error: data.error || null,
        };
        
        return new Response(JSON.stringify(processedResponse), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        });
      } catch (jsonError) {
        // If JSON parsing fails, try to get the error message from the cloned response
        const errorText = await responseClone.text();
        console.error('Failed to parse LlamaIndex job status response:', errorText);
        throw new Error(`Failed to get job status: ${errorText}`);
      }
    }
    
    throw new Error(`Unknown endpoint: ${endpoint}`);
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'FAILED'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 400,
    });
  }
});
