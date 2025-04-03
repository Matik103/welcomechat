import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { OpenAI } from "https://esm.sh/openai@4.28.0";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm";
import mammoth from "https://esm.sh/mammoth@1.6.0";

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

// Helper function to extract text from PDF
async function extractTextFromPDF(pdfData: Uint8Array): Promise<string> {
  try {
    // Initialize PDF.js
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Helper function to extract text from DOCX
async function extractTextFromDOCX(docxData: Uint8Array): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: docxData });
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

// Helper function to extract text from Google Drive URL
async function extractTextFromGoogleDrive(driveUrl: string): Promise<string> {
  try {
    // Extract file ID from Google Drive URL
    const fileId = driveUrl.match(/\/d\/([-\w]{25,})/);
    if (!fileId) {
      throw new Error('Invalid Google Drive URL');
    }
    
    // Convert to direct download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId[1]}`;
    
    // Download the file
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error('Failed to download file from Google Drive. Make sure the file is publicly accessible.');
    }
    
    // Get the content type to determine how to process it
    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    const fileContent = new Uint8Array(arrayBuffer);

    // Process based on content type
    if (contentType.includes('pdf')) {
      return await extractTextFromPDF(fileContent);
    } else if (contentType.includes('wordprocessingml.document') || contentType.includes('docx')) {
      return await extractTextFromDOCX(fileContent);
    } else if (contentType.includes('text/plain')) {
      return new TextDecoder('utf-8').decode(fileContent);
    } else {
      throw new Error(`Unsupported file type from Google Drive: ${contentType}`);
    }
  } catch (error) {
    console.error('Error extracting text from Google Drive:', error);
    throw new Error('Failed to extract text from Google Drive URL. Make sure the file is publicly accessible and in a supported format (PDF, DOCX, or TXT).');
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Check for API key
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    // Parse request body
    const body = await req.json();
    const { client_id, file_data, file_type, drive_url } = body;
    let file_name = body.file_name;

    // Validate required fields
    if (!client_id || (!file_data && !drive_url) || (!file_name && !drive_url)) {
      throw new Error("Missing required fields: client_id and either file data or Google Drive URL are required");
    }

    console.log(`Processing ${drive_url ? 'Google Drive file' : `file "${file_name}"`} for client ${client_id}`);

    let textContent: string;

    if (drive_url) {
      // Handle Google Drive URL
      textContent = await extractTextFromGoogleDrive(drive_url);
      file_name = drive_url.split('/').pop() || 'drive-document.txt';
    } else {
      // Convert base64 to binary
      const fileContent = Uint8Array.from(atob(file_data), c => c.charCodeAt(0));

      // Extract text based on file type
      switch (file_type?.toLowerCase()) {
        case 'application/pdf':
          textContent = await extractTextFromPDF(fileContent);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          textContent = await extractTextFromDOCX(fileContent);
          break;
        case 'text/plain':
          textContent = new TextDecoder('utf-8').decode(fileContent);
          break;
        default:
          throw new Error(`Unsupported file type: ${file_type}`);
      }
    }

    if (!textContent || textContent.trim().length === 0) {
      throw new Error("No text content could be extracted from the document");
    }

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Generate embedding for the text content
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: textContent.trim(),
    });

    if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
      throw new Error("Failed to generate embedding from OpenAI");
    }

    const embedding = embeddingResponse.data[0].embedding;

    // Store file in document-storage bucket
    const timestamp = new Date().getTime();
    const storagePath = `${client_id}/${timestamp}_${file_name}`;
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('document-storage')
      .upload(storagePath, new TextEncoder().encode(textContent), {
        contentType: 'text/plain',
        upsert: true
      });

    if (storageError) {
      throw new Error(`Failed to store file: ${storageError.message}`);
    }

    // Get the public URL for the stored file
    const { data: { publicUrl } } = supabase.storage
      .from('document-storage')
      .getPublicUrl(storagePath);

    // Store document metadata and embedding
    const { data: documentData, error: documentError } = await supabase.rpc('store_document_embedding', {
      p_client_id: client_id,
      p_document_id: timestamp.toString(),
      p_content: textContent,
      p_embedding: embedding
    });

    if (documentError) {
      throw new Error(`Failed to store document embedding: ${documentError.message}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        status: "success",
        message: "File processed and stored successfully",
        file_url: publicUrl,
        document_id: timestamp
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in upload-file-to-openai function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
