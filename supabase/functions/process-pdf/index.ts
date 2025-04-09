
/// <reference types="https://deno.land/std@0.168.0/http/server.ts" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2.38.4" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Type declarations for Deno environment
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface ProcessPDFRequest {
  document_id: string;
  storage_path: string;
  pdf_data?: string;
  retry?: boolean;
}

interface ProcessPDFError {
  document_id: string;
  retry?: boolean;
  error: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const requestData: ProcessPDFRequest = await req.json();
    const { document_id, storage_path, pdf_data, retry = false } = requestData;
    
    console.log('Processing PDF document:', { document_id, storage_path, retry });
    
    let pdfBuffer: ArrayBuffer;
    
    // If this is a retry and no PDF data was provided, fetch it from storage
    if (retry && !pdf_data) {
      console.log('Retry attempt - fetching PDF from storage');
      const { data: fileData, error: storageError } = await supabase.storage
        .from('client_documents')
        .download(storage_path);
        
      if (storageError) {
        throw new Error(`Failed to fetch PDF from storage: ${storageError.message}`);
      }
      
      pdfBuffer = await fileData.arrayBuffer();
    } else if (pdf_data) {
      // Convert base64 data URL to buffer
      const base64Parts = pdf_data.split(',');
      if (base64Parts.length !== 2) {
        throw new Error('Invalid PDF data format: expected base64 data URL');
      }
      const base64Data = base64Parts[1];
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      pdfBuffer = bytes.buffer;
    } else {
      throw new Error('No PDF data available for processing');
    }
    
    // Using the specific RapidAPI key provided by the user
    const rapidApiKey = '109e60ef56msh033c6355bf5052cp149673jsnec27c0641c4d';
    
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'document.pdf');
    
    // Call RapidAPI endpoint with multipart/form-data
    const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
      method: 'POST',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'pdf-to-text-converter.p.rapidapi.com'
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.text();
    
    if (!result) {
      throw new Error('No text extracted from PDF');
    }

    // Update document content with extracted text
    const { error: updateError } = await supabase
      .from('document_content')
      .update({ 
        content: result,
        metadata: {
          processing_status: 'extraction_complete',
          extracted_at: new Date().toISOString(),
          extraction_method: 'rapidapi',
          text_length: result.length
        }
      })
      .eq('id', document_id);

    if (updateError) {
      throw new Error(`Failed to update document content: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      text: result,
      metadata: {
        text_length: result.length,
        extracted_at: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('PDF processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const requestData = await req.json().catch(() => ({})) as ProcessPDFRequest;
    
    // Update document status to indicate failure
    if (requestData.document_id) {
      try {
        await supabase
          .from('document_content')
          .update({ 
            metadata: {
              processing_status: 'extraction_failed',
              error: errorMessage,
              failed_at: new Date().toISOString(),
              retry_count: requestData.retry ? 1 : 0
            }
          })
          .eq('id', requestData.document_id);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
