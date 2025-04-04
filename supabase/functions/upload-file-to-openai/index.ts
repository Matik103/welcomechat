import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

interface ProcessedContent {
  content: string | null;
  uploadData: Uint8Array;
  contentType: string;
  metadata?: {
    size?: number;
    chunks_processed?: number;
    total_chunks?: number;
    current_position?: number;
    extraction_method?: string;
    start_time?: string;
    last_updated?: string;
    retries?: number;
    errors?: string[];
    is_complete?: boolean;
    googleDoc?: {
      title: string;
      mimeType: string;
      lastModified: string;
    };
    processingError?: string;
  };
}

// File type handlers for content processing
const FILE_TYPE_HANDLERS = {
  'text/plain': {
    requiresExtraction: false,
    status: 'ready',
    message: 'Text document uploaded and ready for processing',
    processContent: (data: Uint8Array): ProcessedContent => {
      const content = new TextDecoder().decode(data);
      return {
        content,
        uploadData: data,
        contentType: 'text/plain'
      };
    }
  },
  'application/pdf': {
    requiresExtraction: true,
    status: 'pending_extraction',
    message: 'PDF uploaded and queued for content extraction',
    processContent: (data: Uint8Array): ProcessedContent => {
      return {
        content: null,
        uploadData: data,
        contentType: 'application/pdf',
        metadata: {
          size: data.length,
          chunks_processed: 0,
          total_chunks: Math.ceil(data.length / (1024 * 1024)),
          current_position: 0,
          extraction_method: 'chunked-text-extraction',
          start_time: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          retries: 0,
          errors: [],
          is_complete: false
        }
      };
    }
  },
  'application/vnd.google-apps.document': {
    requiresExtraction: false,
    status: 'ready',
    message: 'Google Doc processed and stored',
    processContent: (data: Uint8Array): ProcessedContent => {
      try {
        const docContent = new TextDecoder().decode(data);
        const parsedContent = JSON.parse(docContent);
        
        let extractedText = '';
        if (parsedContent.body && parsedContent.body.content) {
          extractedText = parsedContent.body.content
            .map((item: any) => {
              if (item.paragraph && item.paragraph.elements) {
                return item.paragraph.elements
                  .map((element: any) => element.textRun?.content || '')
                  .join('');
              }
              return '';
            })
            .join('\n')
            .trim();
        }

        return {
          content: extractedText || parsedContent.content || '',
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
      } catch (err) {
        const error = err as Error;
        const content = new TextDecoder().decode(data);
        return {
          content,
          uploadData: data,
          contentType: 'text/plain',
          metadata: {
            processingError: error.message
          }
        };
      }
    }
  }
};

interface RequestBody {
  client_id: string;
  file_data?: string;
  file_type?: string;
  file_name?: string;
  drive_link?: string;
  assistant_id: string;
}

interface StorageBucket {
  name: string;
  id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  public: boolean;
}

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
  } catch (err) {
    const error = err as Error;
    throw new Error(`Failed to download from Google Drive: ${error.message}`);
  }
}

async function uploadToStorage(storagePath: string, data: Uint8Array, contentType: string): Promise<{ error: Error | null }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { error } = await supabase.storage
        .from('document-storage')
        .upload(storagePath, data, {
          contentType: contentType,
          upsert: true
        });

      if (!error) {
        return { error: null };
      }

      // If it's not the last attempt, wait before retrying
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      } else {
        return { error: new Error(`Upload failed after ${attempt + 1} attempts: ${error.message}`) };
      }
    } catch (error) {
      if (attempt === 2) {
        return { error: error instanceof Error ? error : new Error('Unknown upload error') };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  return { error: new Error('Upload failed after all attempts') };
}

// Type guard for supported file types
function isSupportedFileType(fileType: string): fileType is keyof typeof SUPPORTED_FILE_TYPES {
  return fileType in SUPPORTED_FILE_TYPES;
}

// Type guard for file type handlers
function isValidFileHandler(contentType: string): contentType is keyof typeof FILE_TYPE_HANDLERS {
  return contentType in FILE_TYPE_HANDLERS;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { client_id, file_data, file_type, file_name, drive_link, assistant_id } = body;

    if (!client_id) {
      throw new Error("Missing required field: client_id");
    }

    if (!assistant_id) {
      throw new Error("Missing required field: assistant_id");
    }

    let fileData: Uint8Array;
    let fileName: string;
    let contentType: string;

    // Handle Google Drive link or direct file upload
    if (drive_link) {
      const driveFile = await downloadFromGoogleDrive(drive_link);
      fileData = driveFile.data;
      fileName = driveFile.filename;
      contentType = 'application/pdf'; // Default to PDF for drive links
    } else {
      if (!file_data || !file_type || !file_name) {
        throw new Error("Missing required fields for direct file upload");
      }

      if (!isSupportedFileType(file_type)) {
        throw new Error(`Unsupported file type: ${file_type}`);
      }

      // Decode base64 file data
      const binaryString = atob(file_data);
      fileData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileData[i] = binaryString.charCodeAt(i);
      }
      fileName = file_name;
      contentType = file_type;
    }

    // Get file type handler
    if (!isValidFileHandler(contentType)) {
      throw new Error(`No handler found for file type: ${contentType}`);
    }
    const fileHandler = FILE_TYPE_HANDLERS[contentType];

    // Process the content based on file type
    const processedContent = await fileHandler.processContent(fileData);

    // Generate unique file name and storage path
    const uniqueFileName = `${crypto.randomUUID()}-${fileName}`;
    const storagePath = `${client_id}/${uniqueFileName}`;

    // Upload file to storage with retry logic
    const { error: uploadError } = await uploadToStorage(
      storagePath,
      processedContent.uploadData,
      processedContent.contentType
    );

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('document-storage')
      .getPublicUrl(storagePath);

    // Create document record
    const { data: document, error: documentError } = await supabase
      .from('document_content')
      .insert({
        client_id,
        document_id: storagePath,
        filename: fileName,
        storage_url: publicUrl,
        file_type: processedContent.contentType,
        content: processedContent.content,
        metadata: processedContent.metadata
      })
      .select('id')
      .single();

    if (documentError) {
      throw documentError;
    }

    // Create assistant access record
    const { error: accessError } = await supabase
      .from('assistant_documents')
      .insert({
        document_id: document.id,
        assistant_id: assistant_id,
        client_id: client_id,
        status: fileHandler.requiresExtraction ? 'pending_extraction' : 'ready'
      });

    if (accessError) {
      throw accessError;
    }

    // If PDF, trigger extraction process
    if (fileHandler.requiresExtraction) {
      try {
        const extractionResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/extract-pdf-content`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              document_id: document.id.toString(),
              chunk_size: 1024 * 1024, // 1MB chunks
              max_chunks: 5
            })
          }
        );

        if (!extractionResponse.ok) {
          console.error('Extraction request failed:', await extractionResponse.text());
        }
      } catch (error) {
        console.error('Failed to trigger extraction:', error);
        // Don't throw here - the document is uploaded, extraction can be retried
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: fileHandler.message,
        document: {
          id: document.id,
          storage_path: storagePath,
          file_name: fileName,
          content_type: processedContent.contentType,
          extraction_status: fileHandler.requiresExtraction ? 'pending_extraction' : 'ready'
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error("Error in upload-file-to-openai function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
