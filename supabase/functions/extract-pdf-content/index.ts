import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const DOCUMENTS_BUCKET = 'client_documents';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constants for PDF processing
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface RequestBody {
  document_id: string;
  chunk_size?: number;
  max_chunks?: number;
  continue_from?: number;
}

interface ProcessingMetadata {
  size: number;
  chunks_processed: number;
  total_chunks: number;
  current_position: number;
  extraction_method: string;
  start_time: string;
  last_updated: string;
  retries: number;
  errors: string[];
  is_complete: boolean;
}

interface TextChunk {
  text: string;
  position: number;
  size: number;
}

async function downloadPDFFromStorage(storagePath: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error) {
    throw new Error(`Failed to download PDF: ${error.message}`);
  }

  return new Uint8Array(await data.arrayBuffer());
}

function extractTextFromChunk(
  pdfData: Uint8Array,
  startPos: number,
  chunkSize: number
): TextChunk {
  try {
    let text = '';
    let currentWord = '';
    let inText = false;
    let inObject = false;
    let objectType = '';
    const endPos = Math.min(startPos + chunkSize, pdfData.length);

    for (let i = startPos; i < endPos; i++) {
      const currentByte = pdfData[i];
      if (!currentByte) continue;

      // Track PDF object markers
      if (currentByte === 0x3C && pdfData[i + 1] === 0x3C) { // '<<'
        inObject = true;
        i++;
        continue;
      }
      if (currentByte === 0x3E && pdfData[i + 1] === 0x3E) { // '>>'
        inObject = false;
        objectType = '';
        i++;
        continue;
      }

      // Track text markers
      if (currentByte === 0x28 && (!inObject || objectType === '/Text')) { // '('
        inText = true;
        continue;
      }
      if (currentByte === 0x29) { // ')'
        inText = false;
        if (currentWord.length > 0) {
          text += currentWord + ' ';
          currentWord = '';
        }
        continue;
      }

      // Track object type
      if (inObject && currentByte === 0x2F) { // '/'
        let typeStr = '';
        let j = i + 1;
        while (j < endPos && pdfData[j] && pdfData[j] >= 0x20 && pdfData[j] <= 0x7E) {
          typeStr += String.fromCharCode(pdfData[j]);
          j++;
        }
        if (typeStr === 'Text') {
          objectType = '/Text';
        }
        i = j - 1;
        continue;
      }

      if (inText) {
        // Handle PDF text encoding
        if (currentByte === 0x5C) { // '\'
          i++;
          const nextByte = pdfData[i];
          if (!nextByte) continue;

          if (nextByte >= 0x30 && nextByte <= 0x37) { // Octal
            const octal = pdfData.slice(i, i + 3)
              .filter((b): b is number => b !== undefined)
              .map(b => String.fromCharCode(b))
              .join('');
            currentWord += String.fromCharCode(parseInt(octal, 8));
            i += 2;
          } else {
            // Handle other escape sequences
            const escapeMap: { [key: string]: string } = {
              'n': '\n', 'r': '\r', 't': '\t', 'b': '\b', 'f': '\f',
              '(': '(', ')': ')', '\\': '\\'
            };
            currentWord += escapeMap[String.fromCharCode(nextByte)] || '';
          }
        } else if (currentByte >= 0x20 && currentByte <= 0x7E) { // Printable ASCII
          currentWord += String.fromCharCode(currentByte);
        }
      }
    }

    // Clean up the extracted text
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable characters and whitespace
      .trim();

    return {
      text,
      position: startPos,
      size: endPos - startPos
    };
  } catch (error) {
    console.error('Chunk extraction error:', error);
    throw error;
  }
}

async function processChunks(
  pdfData: Uint8Array,
  chunkSize: number,
  maxChunks: number,
  continueFrom: number,
  existingMetadata?: ProcessingMetadata
): Promise<{ text: string; metadata: ProcessingMetadata }> {
  const metadata: ProcessingMetadata = existingMetadata || {
    size: pdfData.length,
    chunks_processed: 0,
    total_chunks: Math.ceil(pdfData.length / chunkSize),
    current_position: continueFrom,
    extraction_method: 'chunked-text-extraction',
    start_time: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    retries: 0,
    errors: [],
    is_complete: false
  };

  let extractedText = '';
  let chunksProcessed = 0;

  while (metadata.current_position < pdfData.length && chunksProcessed < maxChunks) {
    try {
      const chunk = extractTextFromChunk(
        pdfData,
        metadata.current_position,
        chunkSize
      );

      extractedText += chunk.text + '\n';
      metadata.current_position += chunk.size;
      metadata.chunks_processed++;
      chunksProcessed++;

      // Update progress
      metadata.last_updated = new Date().toISOString();
    } catch (error) {
      console.error('Chunk processing error:', error);
      metadata.errors.push(`Error at position ${metadata.current_position}: ${error.message}`);
      
      if (metadata.retries < MAX_RETRIES) {
        metadata.retries++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      } else {
        throw new Error(`Failed to process chunk after ${MAX_RETRIES} retries`);
      }
    }
  }

  metadata.is_complete = metadata.current_position >= pdfData.length;

  return {
    text: extractedText.trim(),
    metadata
  };
}

async function updateDocumentContent(
  documentId: number,
  content: string,
  metadata: ProcessingMetadata,
  append: boolean = false
) {
  // Get existing content if appending
  let existingContent = '';
  if (append) {
    const { data, error } = await supabase
      .from('document_content')
      .select('content')
      .eq('id', documentId)
      .single();

    if (!error && data?.content) {
      existingContent = data.content;
    }
  }

  const finalContent = append ? existingContent + '\n' + content : content;

  const { error } = await supabase
    .from('document_content')
    .update({
      content: finalContent,
      metadata: {
        ...metadata,
        last_updated: new Date().toISOString()
      }
    })
    .eq('id', documentId);

  if (error) {
    throw new Error(`Failed to update document content: ${error.message}`);
  }

  if (metadata.is_complete) {
    // Update status in assistant_documents table
    const { error: statusError } = await supabase
      .from('assistant_documents')
      .update({ status: 'ready' })
      .eq('document_id', documentId);

    if (statusError) {
      throw new Error(`Failed to update document status: ${statusError.message}`);
    }
  }
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
    const {
      document_id,
      chunk_size = CHUNK_SIZE,
      max_chunks = 5,
      continue_from = 0
    } = await req.json() as RequestBody;

    if (!document_id) {
      throw new Error("Missing required field: document_id");
    }

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('document_content')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || 'Unknown error'}`);
    }

    // Download and process PDF
    const storagePath = document.storage_url.split('public/documents/')[1];
    const pdfData = await downloadPDFFromStorage(storagePath);
    
    // Get existing metadata if continuing processing
    const existingMetadata = continue_from > 0 && document.metadata
      ? document.metadata as ProcessingMetadata
      : undefined;

    const { text, metadata } = await processChunks(
      pdfData,
      chunk_size,
      max_chunks,
      continue_from,
      existingMetadata
    );

    // Update document content and metadata
    await updateDocumentContent(
      parseInt(document_id),
      text,
      metadata,
      continue_from > 0 // Append if continuing from a position
    );

    return new Response(
      JSON.stringify({
        status: "success",
        message: metadata.is_complete ? "PDF extraction completed" : "Chunk processing completed",
        metadata: metadata,
        text_preview: text.substring(0, 200) + '...',
        next_chunk: metadata.is_complete ? null : metadata.current_position
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error in extract-pdf-content function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 