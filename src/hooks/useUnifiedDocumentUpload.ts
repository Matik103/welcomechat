
// Streamlined document upload hook with direct RapidAPI integration
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from '@/config/env';

export interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  extractedText?: string;
  publicUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface UseUnifiedDocumentUploadOptions {
  clientId?: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error | string) => void;
  onProgress?: (progress: number) => void;
}

export const useUnifiedDocumentUpload = (options: UseUnifiedDocumentUploadOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = async (file: File, clientId?: string): Promise<UploadResult> => {
    // Use the clientId from options if not provided directly
    const effectiveClientId = clientId || options.clientId;
    
    if (!effectiveClientId) {
      const error = new Error("Client ID is required");
      if (options.onError) options.onError(error);
      toast.error("Client ID is required");
      return { success: false, error: error.message };
    }

    setIsLoading(true);
    setUploadProgress(0);
    if (options.onProgress) options.onProgress(0);

    try {
      if (options.onProgress) options.onProgress(20);
      setUploadProgress(20);

      // Generate document ID
      const documentId = uuidv4();

      // Upload to storage bucket first
      const filePath = `${effectiveClientId}/${documentId}/${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Error uploading file to storage: ${uploadError.message}`);
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);
      
      setUploadProgress(40);
      if (options.onProgress) options.onProgress(40);

      // If it's a PDF, extract text using RapidAPI
      let extractedText = '';
      if (file.type === 'application/pdf') {
        // Create form data for RapidAPI
        const formData = new FormData();
        formData.append('file', file);

        try {
          if (RAPIDAPI_KEY) {
            // Extract text using RapidAPI
            const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
              method: 'POST',
              headers: {
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY
              },
              body: formData
            });

            if (!response.ok) {
              console.warn(`Text extraction API responded with status: ${response.status}. Will continue without text extraction.`);
              if (response.status === 401 || response.status === 403) {
                console.error('RapidAPI authentication failed. Please check your API key.');
              }
            } else {
              extractedText = await response.text();
            }
          } else {
            console.warn("No RapidAPI key found. Skipping text extraction.");
          }
        } catch (extractionError) {
          console.warn("Text extraction failed but will continue with document upload:", extractionError);
          // Don't throw here - we want to continue even if text extraction fails
        }
      }
      
      setUploadProgress(60);
      if (options.onProgress) options.onProgress(60);

      // Store document and extracted text in database
      const { error: documentError } = await supabase
        .from('document_content')
        .insert({
          client_id: effectiveClientId,
          document_id: documentId,
          content: extractedText,
          filename: file.name,
          file_type: file.type,
          metadata: {
            filename: file.name,
            file_type: file.type,
            size: file.size,
            storage_path: filePath,
            storage_url: publicUrl,
            uploadedAt: new Date().toISOString(),
            processing_status: file.type === 'application/pdf' ? (extractedText ? 'extraction_complete' : 'extraction_failed') : 'ready',
            extraction_method: file.type === 'application/pdf' ? (RAPIDAPI_KEY ? 'rapidapi' : 'skipped') : null,
            text_length: extractedText.length || 0,
            extracted_at: file.type === 'application/pdf' ? new Date().toISOString() : null,
            extraction_success: file.type === 'application/pdf' ? (extractedText.length > 0) : null
          }
        });

      if (documentError) {
        throw new Error(`Failed to store document: ${documentError.message}`);
      }

      setUploadProgress(100);
      if (options.onProgress) options.onProgress(100);

      const result: UploadResult = {
        success: true,
        documentId,
        extractedText,
        publicUrl,
        fileName: file.name,
        fileType: file.type
      };

      if (options.onSuccess) options.onSuccess(result);
      return result;

    } catch (error) {
      console.error('Document processing error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (options.onError) options.onError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        fileName: file.name,
        fileType: file.type
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
