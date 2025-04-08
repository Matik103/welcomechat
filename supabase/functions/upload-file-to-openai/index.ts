
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const requestData = await req.json();
    const { fileData, fileName, fileType, documentId } = requestData;

    if (!fileData || !fileName) {
      throw new Error('File data and file name are required');
    }

    console.log(`Processing file: ${fileName} (${fileType})`);

    // If it's a PDF file, use RapidAPI to extract text
    if (fileType === 'application/pdf') {
      const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
      
      if (!rapidApiKey) {
        throw new Error('RAPIDAPI_KEY environment variable is not set');
      }

      // Extract base64 content from data URL
      const base64Data = fileData.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid file data format');
      }

      // Convert base64 to Blob for form data
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', new Blob([bytes], { type: 'application/pdf' }), fileName);

      // Send to RapidAPI PDF-to-text converter
      const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
        method: 'POST',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'pdf-to-text-converter.p.rapidapi.com'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
      }

      const extractedText = await response.text();

      // Update document record with the extracted text if documentId was provided
      if (documentId) {
        await supabase
          .from('document_content')
          .update({
            content: extractedText,
            metadata: {
              processing_status: 'extraction_complete',
              extracted_at: new Date().toISOString(),
              extraction_method: 'rapidapi',
              text_length: extractedText.length
            }
          })
          .eq('id', documentId);
      }

      // Return success with extracted text
      return new Response(JSON.stringify({
        success: true,
        text: extractedText,
        fileName,
        fileType
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For non-PDF files or if extraction fails, return simple success response
    return new Response(JSON.stringify({
      success: true,
      fileName,
      fileType,
      message: 'File processed (no text extraction performed)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing file:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
