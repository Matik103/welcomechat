// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @deno-types="https://esm.sh/@supabase/supabase-js@2.38.4"
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
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    
    let pdfDataToProcess = pdf_data;
    
    // If this is a retry and no PDF data was provided, fetch it from storage
    if (retry && !pdf_data) {
      console.log('Retry attempt - fetching PDF from storage');
      const { data: fileData, error: storageError } = await supabase.storage
        .from('client_documents')
        .download(storage_path);
        
      if (storageError) {
        throw new Error(`Failed to fetch PDF from storage: ${storageError.message}`);
      }
      
      // Convert the file data to base64
      const buffer = await fileData.arrayBuffer();
      pdfDataToProcess = `data:application/pdf;base64,${btoa(String.fromCharCode(...new Uint8Array(buffer)))}`;
    }
    
    if (!pdfDataToProcess) {
      throw new Error('No PDF data available for processing');
    }
    
    // Extract base64 data from the data URL
    const base64Data = pdfDataToProcess.split(',')[1];
    
    // Create form data string
    const formData = `base64=${encodeURIComponent(base64Data)}`;
    
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY environment variable is not set');
    }
    
    // Call RapidAPI endpoint
    const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'pdf-to-text-converter.p.rapidapi.com'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.text) {
      throw new Error('No text extracted from PDF');
    }

    // Update document content with extracted text
    const { error: updateError } = await supabase
      .from('document_content')
      .update({ 
        content: result.text,
        metadata: {
          processing_status: 'extraction_complete',
          extracted_at: new Date().toISOString(),
          extraction_method: 'rapidapi',
          text_length: result.text.length
        }
      })
      .eq('id', document_id);

    if (updateError) {
      throw new Error(`Failed to update document content: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      text: result.text,
      metadata: {
        text_length: result.text.length,
        extracted_at: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('PDF processing error:', error);
    
    const errorData = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse: ProcessPDFError = {
      document_id: (await req.json()).document_id,
      retry: (await req.json()).retry,
      error: errorData
    };
    
    // Update document status to indicate failure
    try {
      await supabase
        .from('document_content')
        .update({ 
          metadata: {
            processing_status: 'extraction_failed',
            error: errorData,
            failed_at: new Date().toISOString(),
            retry_count: errorResponse.retry ? 1 : 0
          }
        })
        .eq('id', errorResponse.document_id);
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorData
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
