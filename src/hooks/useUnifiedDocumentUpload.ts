// Streamlined document upload hook with direct RapidAPI integration
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

export interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  extractedText?: string;
}

interface UseUnifiedDocumentUploadOptions {
  clientId: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error | string) => void;
  onProgress?: (progress: number) => void;
}

interface DocumentMetadata {
  [key: string]: string | number | null | undefined;
  filename: string;
  file_type: string;
  size: number;
  uploadedAt: string;
  processing_status: string;
  extraction_method?: string;
  text_length?: number;
  extracted_at?: string;
  error?: string;
}

export const useUnifiedDocumentUpload = ({
  clientId,
  onSuccess,
  onError,
  onProgress
}: UseUnifiedDocumentUploadOptions) => {
  const [isLoading, setIsLoading] = useState(false);

  const upload = async (file: File): Promise<UploadResult> => {
    if (!clientId) {
      const error = new Error("Client ID is required");
      if (onError) onError(error);
      return { success: false, error: error.message };
    }

    if (file.type !== 'application/pdf') {
      const error = new Error("Only PDF files are supported");
      if (onError) onError(error);
      return { success: false, error: error.message };
    }

    setIsLoading(true);
    if (onProgress) onProgress(0);

    try {
      if (onProgress) onProgress(20);

      // Create form data for RapidAPI
      const formData = new FormData();
      formData.append('file', file);

      if (onProgress) onProgress(40);

      // Extract text using RapidAPI
      const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
        method: 'POST',
        headers: {
          'x-rapidapi-host': import.meta.env.VITE_RAPIDAPI_HOST,
          'x-rapidapi-key': import.meta.env.VITE_RAPIDAPI_KEY
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Text extraction failed: ${response.status} ${response.statusText}`);
      }

      const extractedText = await response.text();
      if (onProgress) onProgress(60);

      // Generate document ID
      const documentId = uuidv4();

      // Store document and extracted text in database
      const { error: documentError } = await supabase
        .from('document_content')
        .insert({
          client_id: clientId,
          document_id: documentId,
          content: extractedText,
          filename: file.name,
          file_type: file.type,
          metadata: {
            filename: file.name,
            file_type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            processing_status: 'extraction_complete',
            extraction_method: 'rapidapi',
            text_length: extractedText.length,
            extracted_at: new Date().toISOString()
          } as Record<string, string | number | null>
        });

      if (documentError) {
        throw new Error(`Failed to store document: ${documentError.message}`);
      }

      if (onProgress) onProgress(100);

      const result: UploadResult = {
        success: true,
        documentId,
        extractedText
      };

      if (onSuccess) onSuccess(result);
      return result;

    } catch (error) {
      console.error('Document processing error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (onError) onError(errorMessage);
      return { success: false, error: errorMessage };

    } finally {
      setIsLoading(false);
    }
  };

  return {
    upload,
    isLoading
  };
};
