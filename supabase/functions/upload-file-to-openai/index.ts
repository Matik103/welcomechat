import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Get environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supported file types and their content types
const SUPPORTED_FILE_TYPES = {
  'text/plain': { 
    maxSize: 10 * 1024 * 1024, // 10MB
    storageType: 'text/plain'
  },
  'application/pdf': { 
    maxSize: 20 * 1024 * 1024, // 20MB
    storageType: 'application/pdf'
  },
  'application/vnd.google-apps.document': { 
    maxSize: 50 * 1024 * 1024, // 50MB for Google Docs
    storageType: 'text/plain' // Store as plain text
  }
};

// File type mappings for content handling
const FILE_TYPE_HANDLERS = {
  'text/plain': {
    requiresExtraction: false,
    status: 'pending',
    message: 'Text document uploaded and ready for processing',
    processContent: (data: Uint8Array) => {
      return {
        content: new TextDecoder().decode(data),
        uploadData: data,
        contentType: 'text/plain'
      };
    }
  },
  'application/pdf': {
    requiresExtraction: true,
    status: 'pending_extraction',
    message: 'PDF uploaded and queued for content extraction',
    processContent: (data: Uint8Array) => {
      return {
        content: null,
        uploadData: data,
        contentType: 'application/pdf'
      };
    }
  },
  'application/vnd.google-apps.document': {
    requiresExtraction: false,
    status: 'pending',
    message: 'Google Doc processed and stored',
    processContent: (data: Uint8Array) => {
      const docContent = new TextDecoder().decode(data);
      const parsedContent = JSON.parse(docContent);
      const extractedText = parsedContent.content || '';
      return {
        content: extractedText,
        uploadData: new TextEncoder().encode(extractedText),
        contentType: 'text/plain',
        metadata: {
          googleDoc: {
            title: parsedContent.title,
            mimeType: parsedContent.mimeType,
            lastModified: new Date().toISOString()
          }
        }
      };
    }
  }
};

async function downloadFromGoogleDrive(driveLink: string): Promise<{ data: Uint8Array; filename: string }> {
  try {
    // Extract file ID from Google Drive link
    const fileId = driveLink.match(/[-\w]{25,}/)?.[0];
    if (!fileId) {
      throw new Error("Invalid Google Drive link");
    }

    // Construct direct download link
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    // Get filename from headers
    const headResponse = await fetch(downloadUrl, { method: 'HEAD' });
    const contentDisposition = headResponse.headers.get('content-disposition');
    const filename = contentDisposition?.split('filename=')?.[1]?.replace(/["']/g, '') || 'document.pdf';

    // Download file
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      data: new Uint8Array(arrayBuffer),
      filename: filename
    };
  } catch (error) {
    throw new Error(`Failed to download from Google Drive: ${error.message}`);
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
    const {
      client_id,
      file_data,
      file_type,
      file_name,
      assistant_id,
      drive_link
    } = await req.json();

    if (!client_id) {
      throw new Error("Missing required field: client_id");
    }

    if (!assistant_id) {
      throw new Error("Missing required field: assistant_id");
    }

    let fileData: Uint8Array;
    let fileName: string;

    // Handle Google Drive link or direct file upload
    if (drive_link) {
      const driveFile = await downloadFromGoogleDrive(drive_link);
      fileData = driveFile.data;
      fileName = driveFile.filename;
    } else {
      if (!file_data || !file_type || !file_name) {
        throw new Error("Missing required fields for direct file upload");
      }

      // Decode base64 file data
      const binaryString = atob(file_data);
      fileData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileData[i] = binaryString.charCodeAt(i);
      }
      fileName = file_name;
    }

    // Generate unique file name
    const uniqueFileName = `${crypto.randomUUID()}-${fileName}`;
    const storagePath = `${client_id}/${uniqueFileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileData, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    // Create document record
    const { data: document, error: documentError } = await supabase
      .from('document_content')
      .insert({
        filename: fileName,
        storage_url: publicUrl,
        file_type: 'application/pdf',
        requires_extraction: true
      })
      .select()
      .single();

    if (documentError) {
      throw documentError;
    }

    // Create assistant document record
    const { error: assistantDocError } = await supabase
      .from('assistant_documents')
      .insert({
        assistant_id: assistant_id,
        document_id: document.id,
        status: 'pending'
      });

    if (assistantDocError) {
      throw assistantDocError;
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: "File uploaded and queued for content extraction",
        document_id: document.id,
        storage_url: publicUrl,
        requires_extraction: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
