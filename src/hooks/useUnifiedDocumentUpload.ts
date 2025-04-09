import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { DOCUMENTS_BUCKET, ensureBucketExists } from '@/utils/ensureStorageBuckets';

// Define the return type for the upload function
export interface UploadResult {
  success: boolean;
  error?: string;
  documentId?: string;
  fileName?: string;
  fileType?: string;
  publicUrl?: string;
}

export function useUnifiedDocumentUpload(options: {
  clientId: string | undefined;
  onSuccess?: (result: UploadResult) => void;
  onProgress?: (progress: number) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const { clientId, onSuccess, onProgress } = options;

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    if (!clientId) {
      return { success: false, error: 'Client ID is required' };
    }

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    setIsUploading(true);

    try {
      // First, ensure the bucket exists
      const bucketExists = await ensureBucketExists(DOCUMENTS_BUCKET);
      if (!bucketExists) {
        return { 
          success: false, 
          error: `Storage bucket "${DOCUMENTS_BUCKET}" not found.`,
          fileName: file.name
        };
      }
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const uniqueId = uuidv4();
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message, fileName: file.name };
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(DOCUMENTS_BUCKET)
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

      // Store document metadata in the document_content table
      const { data: documentData, error: documentError } = await supabase
        .from('document_content')
        .insert({
          client_id: clientId,
          document_id: uniqueId,
          content: null,
          filename: file.name,
          file_type: file.type,
          metadata: {
            size: file.size,
            storage_path: filePath,
            storage_url: urlData.publicUrl,
            uploadedAt: new Date().toISOString(),
            processing_status: file.type === 'application/pdf' ? 'pending_extraction' : 'ready'
          }
        })
        .select()
        .single();

      if (documentError) {
        console.error('Error storing document metadata:', documentError);
        
        // Try to clean up the uploaded file
        const { error: removeError } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
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
            document_id: parseInt(documentData.document_id),
            client_id: clientId,
            status: file.type === 'application/pdf' ? 'pending' : 'ready'
          });

        if (assistantDocError) {
          console.error('Error associating document with assistant:', assistantDocError);
          // Continue anyway, the document is already stored
        }
      }

      // If it's a PDF, trigger the extraction process
      if (file.type === 'application/pdf') {
        try {
          const { data: extractionResponse, error: extractionError } = await supabase
            .functions.invoke('extract-pdf-content', {
              body: { 
                document_id: documentData.id.toString(),
                storage_path: filePath,
                retry: false
              }
            });

          if (extractionError) {
            console.error('PDF extraction error:', extractionError);
          }
        } catch (extractionError) {
          console.error('Failed to invoke PDF extraction:', extractionError);
        }
      }

      const result = {
        success: true,
        documentId: documentData.id.toString(),
        publicUrl: urlData.publicUrl,
        fileName: file.name
      };
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      console.error('Document upload error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error during upload',
        fileName: file.name
      };
    } finally {
      setIsUploading(false);
    }
  }, [clientId, onSuccess]);

  return {
    upload,
    isUploading
  };
}
