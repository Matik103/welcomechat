
// Streamlined document upload hook with direct RapidAPI integration
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

export interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  url?: string;
  path?: string;
}

interface UseUnifiedDocumentUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error | string) => void;
  onProgress?: (progress: number) => void;
}

interface DocumentMetadata {
  [key: string]: string | number | null | undefined;
  filename?: string;
  file_type?: string;
  size?: number;
  upload_path?: string;
  url?: string;
  uploadedAt?: string;
  processing_status?: string;
  error?: string;
  extracted_at?: string;
  text_length?: number;
}

interface DocumentData {
  id: number;
  metadata?: DocumentMetadata;
}

export const useUnifiedDocumentUpload = (options?: UseUnifiedDocumentUploadOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = async (file: File, clientId: string): Promise<UploadResult> => {
    if (!clientId) {
      const error = new Error("Client ID is required for document upload");
      if (options?.onError) options.onError(error);
      return { success: false, error: error.message };
    }

    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      // Generate unique ID for the document
      const documentId = uuidv4();
      
      // Create a file path for storage
      const fileExtension = file.name.split('.').pop() || '';
      const filePath = `${clientId}/${documentId}.${fileExtension}`;
      
      setUploadProgress(20);
      
      // Upload the file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
        
      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      
      setUploadProgress(50);
      
      // Get the public URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);
      
      const url = urlData?.publicUrl || '';
      
      // Create document record in the database
      const { data: documentData, error: documentError } = await supabase
        .from('document_content')
        .insert({
          client_id: clientId,
          document_id: documentId,
          content: null,
          metadata: {
            filename: file.name,
            file_type: file.type,
            size: file.size,
            upload_path: filePath,
            url: url,
            uploadedAt: new Date().toISOString(),
            processing_status: file.type === 'application/pdf' ? 'pending_extraction' : 'ready'
          } as DocumentMetadata,
          file_type: file.type,
          filename: file.name
        })
        .select('id, metadata')
        .single();
        
      if (documentError) {
        throw new Error(`Document record creation failed: ${documentError.message}`);
      }
      
      setUploadProgress(80);
      
      // If it's a PDF, process it with RapidAPI
      if (file.type === 'application/pdf') {
        try {
          // Create form data
          const formData = new FormData();
          formData.append('file', file);

          // Call RapidAPI endpoint
          const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
            method: 'POST',
            headers: {
              'x-rapidapi-host': 'pdf-to-text-converter.p.rapidapi.com',
              'x-rapidapi-key': import.meta.env.VITE_RAPIDAPI_KEY
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
          }

          const extractedText = await response.text();

          // Update document with extracted text
          const { error: updateError } = await supabase
            .from('document_content')
            .update({
              content: extractedText,
              metadata: {
                ...(documentData.metadata as DocumentMetadata),
                processing_status: 'extraction_complete',
                extraction_method: 'rapidapi',
                text_length: extractedText.length,
                extracted_at: new Date().toISOString()
              }
            })
            .eq('id', documentData.id);

          if (updateError) {
            throw new Error(`Failed to update document content: ${updateError.message}`);
          }
        } catch (error) {
          console.error('PDF processing error:', error);
          
          // Update document status to indicate failure
          await supabase
            .from('document_content')
            .update({
              metadata: {
                ...(documentData.metadata as DocumentMetadata),
                processing_status: 'extraction_failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                failed_at: new Date().toISOString()
              }
            })
            .eq('id', documentData.id);
        }
      }
      
      setUploadProgress(100);
      
      const result: UploadResult = {
        success: true,
        documentId,
        url,
        path: filePath
      };
      
      if (options?.onSuccess) options.onSuccess(result);
      
      return result;
    } catch (error) {
      console.error('Document upload error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (options?.onError) options.onError(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    upload,
    isLoading,
    uploadProgress
  };
};
