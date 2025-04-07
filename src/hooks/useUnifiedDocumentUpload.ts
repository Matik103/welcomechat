
// Streamlined document upload hook with direct RapidAPI integration
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { RAPIDAPI_KEY, RAPIDAPI_HOST, PDF_PROCESSING } from '@/config/env';

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
      // Validate file size
      if (file.size > PDF_PROCESSING.maxFileSize) {
        throw new Error(`File is too large. Maximum allowed size is ${PDF_PROCESSING.maxFileSize / (1024 * 1024)}MB`);
      }

      if (options.onProgress) options.onProgress(10);
      setUploadProgress(10);

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
        formData.append('ocr', 'true'); // Enable OCR for better text extraction
        formData.append('language', 'eng'); // Set language for OCR
        formData.append('quality', 'high'); // Request high quality extraction

        // Always use the hardcoded API key as fallback
        const rapidApiKey = RAPIDAPI_KEY;
        const rapidApiHost = RAPIDAPI_HOST;
        
        if (!rapidApiKey) {
          console.error("RapidAPI key is missing. Text extraction cannot be performed.");
          toast.error("API configuration error: Missing API key");
          throw new Error("RapidAPI key is missing. Text extraction cannot be performed.");
        }

        try {
          // Extract text using RapidAPI with increased timeout
          console.log(`Processing PDF (${(file.size / (1024 * 1024)).toFixed(2)}MB): ${file.name}`);
          
          // Set longer timeout for large files
          const timeoutDuration = Math.min(900000, Math.max(120000, file.size / 1024)); // Min 2 minutes, max 15 minutes, scaled by file size
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
          
          const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
            method: 'POST',
            headers: {
              'x-rapidapi-host': rapidApiHost,
              'x-rapidapi-key': rapidApiKey,
              'x-pdf-optimization': 'high',
              'x-processing-priority': 'high',
              'x-large-file': file.size > 10 * 1024 * 1024 ? 'true' : 'false', // Indicate large file to API
            },
            body: formData,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            const statusCode = response.status;
            let errorDetail = '';
            try {
              const errorData = await response.json();
              errorDetail = errorData.message || '';
            } catch (e) {
              // If we can't parse the error as JSON, just use the status text
              errorDetail = response.statusText;
            }
            
            throw new Error(`Text extraction API responded with status: ${statusCode}. ${errorDetail}`);
          }

          extractedText = await response.text();
          
          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('API returned empty text content');
          }
          
          console.log("Text extraction successful, extracted length:", extractedText.length);
        } catch (extractionError) {
          console.error("Text extraction failed:", extractionError);
          
          // Check for specific error types
          if (extractionError.name === 'AbortError') {
            throw new Error(`PDF processing timed out after ${timeoutDuration/1000} seconds. The file may be too large or complex.`);
          }
          
          throw new Error(`Failed to extract text from PDF: ${extractionError instanceof Error ? extractionError.message : String(extractionError)}`);
        }
      }
      
      setUploadProgress(80);
      if (options.onProgress) options.onProgress(80);

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
            processing_status: file.type === 'application/pdf' ? 'extraction_complete' : 'ready',
            extraction_method: file.type === 'application/pdf' ? 'rapidapi' : null,
            text_length: extractedText.length || 0,
            extracted_at: file.type === 'application/pdf' ? new Date().toISOString() : null,
            extraction_success: file.type === 'application/pdf' ? (extractedText.length > 0) : null,
            file_size_mb: (file.size / (1024 * 1024)).toFixed(2)
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
