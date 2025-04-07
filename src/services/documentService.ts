import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from '@/config/env';

interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  processed?: number;
  failed?: number;
  documentUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface UploadOptions {
  agentName?: string;
  shouldProcessWithOpenAI?: boolean;
}

interface DocumentMetadata {
  clientId: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  processing_status?: string;
  extraction_method?: string;
  text_length?: number;
  [key: string]: any;
}

/**
 * Unified document upload service that handles storage and database updates
 */
export const uploadDocument = async (
  clientId: string, 
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    if (!clientId) {
      return { success: false, error: 'Client ID is required' };
    }

    console.log('Starting document upload for client:', clientId);

    // Generate a unique file path using UUID
    const uniqueId = crypto.randomUUID();
    const filePath = `${clientId}/${uniqueId}/${file.name}`;
    
    // Upload to storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return { 
        success: false, 
        error: uploadError.message,
        fileName: file.name,
        fileType: file.type
      };
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('client_documents')
      .getPublicUrl(filePath);
    
    // Get the client's assistant
    const { data: assistantData, error: assistantError } = await supabase
      .from('ai_agents')
      .select('openai_assistant_id, name')
      .eq('client_id', clientId)
      .single();
      
    if (assistantError) {
      console.error('Error finding assistant for client:', assistantError);
      // Continue anyway, we'll just store the document without associating with assistant
    }

    // Extract text if it's a PDF file
    let extractedText = null;
    let processingStatus = 'ready';
    
    if (file.type === 'application/pdf') {
      processingStatus = 'pending_extraction';
      
      try {
        // Process the PDF with RapidAPI directly
        const formData = new FormData();
        formData.append('file', file);
        
        // Get RapidAPI key from env, with hardcoded fallback
        const rapidApiKey = RAPIDAPI_KEY;
        const rapidApiHost = RAPIDAPI_HOST;
        
        if (!rapidApiKey) {
          console.error('RapidAPI key is missing. PDF text extraction cannot be performed.');
          processingStatus = 'extraction_failed';
          throw new Error('RapidAPI key is missing');
        }
        
        const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
          method: 'POST',
          headers: {
            'x-rapidapi-host': rapidApiHost,
            'x-rapidapi-key': rapidApiKey
          },
          body: formData
        });
        
        if (response.ok) {
          extractedText = await response.text();
          processingStatus = 'extraction_complete';
          console.log('PDF text extraction successful, length:', extractedText.length);
        } else {
          console.error('PDF extraction failed with status:', response.status);
          processingStatus = 'extraction_failed';
        }
      } catch (extractError) {
        console.error('Error extracting PDF text:', extractError);
        processingStatus = 'extraction_failed';
      }
    }

    // Store document metadata in the document_content table
    const { data: documentData, error: documentError } = await supabase
      .from('document_content')
      .insert({
        client_id: clientId,
        document_id: uniqueId,
        content: extractedText,
        filename: file.name,
        file_type: file.type,
        metadata: {
          size: file.size,
          storage_path: filePath,
          storage_url: publicUrl,
          uploadedAt: new Date().toISOString(),
          processing_status: processingStatus,
          extraction_method: file.type === 'application/pdf' ? 'rapidapi' : null,
          text_length: extractedText ? extractedText.length : 0,
          extracted_at: extractedText ? new Date().toISOString() : null
        }
      })
      .select()
      .single();

    if (documentError) {
      console.error('Error storing document metadata:', documentError);
      
      // Try to clean up the uploaded file
      const { error: removeError } = await supabase.storage
        .from('client_documents')
        .remove([filePath]);
        
      if (removeError) {
        console.error('Failed to clean up file after document error:', removeError);
      }
      
      return { 
        success: false, 
        error: documentError.message,
        fileName: file.name,
        fileType: file.type
      };
    }

    // If we have an assistant, associate the document with it
    if (assistantData?.openai_assistant_id) {
      const { error: assistantDocError } = await supabase
        .from('assistant_documents')
        .insert({
          assistant_id: assistantData.openai_assistant_id,
          client_id: clientId,
          filename: file.name,
          file_type: file.type,
          storage_path: filePath,
          metadata: {
            size: file.size,
            storage_url: publicUrl,
            uploadedAt: new Date().toISOString(),
            has_extracted_text: extractedText !== null
          },
          status: processingStatus === 'extraction_complete' ? 'ready' : processingStatus
        });

      if (assistantDocError) {
        console.error('Error associating document with assistant:', assistantDocError);
        // Continue anyway, the document is already stored
      }
    }

    return {
      success: true,
      documentId: documentData.id.toString(),
      documentUrl: publicUrl,
      fileName: file.name,
      fileType: file.type,
      processed: 1,
      failed: 0
    };
  } catch (error) {
    console.error('Unexpected error in uploadDocument:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during document upload',
      processed: 0,
      failed: 1,
      fileName: file.name,
      fileType: file.type
    };
  }
};

export async function getDocumentContent(documentId: string) {
  const { data, error } = await supabase
    .from('document_content')
    .select('*')
    .eq('id', parseInt(documentId))
    .single();

  if (error) {
    throw new Error(`Failed to fetch document content: ${error.message}`);
  }

  return data;
}

export async function updateDocumentContent(documentId: string, content: string, metadata: DocumentMetadata) {
  const { error } = await supabase
    .from('document_content')
    .update({ 
      content,
      metadata: {
        ...metadata,
        updated_at: new Date().toISOString()
      }
    })
    .eq('id', parseInt(documentId));

  if (error) {
    throw new Error(`Failed to update document content: ${error.message}`);
  }
}

export async function deleteDocument(documentId: string) {
  const { error } = await supabase
    .from('document_content')
    .delete()
    .eq('id', parseInt(documentId));

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}
