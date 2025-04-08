// Streamlined document upload hook with direct RapidAPI integration
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { RAPIDAPI_HOST, RAPIDAPI_KEY } from '@/config/env';

interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  extractedText?: string;
  publicUrl?: string;
  fileName?: string;
  fileType?: string;
}

export const useUnifiedDocumentUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadDocument = async (formData: FormData): Promise<UploadResult> => {
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;

    if (!file || !clientId) {
      return { success: false, error: 'File and Client ID are required' };
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Step 1: Upload to Supabase Storage
      setProgress(20);
      const documentId = uuidv4();
      const filePath = `${clientId}/${documentId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);

      setProgress(40);

      // Step 2: Extract text if PDF
      let extractedText = '';
      let processingStatus = 'ready';

      if (file.type === 'application/pdf') {
        setProgress(60);
        processingStatus = 'extracting';
        
        try {
          const pdfFormData = new FormData();
          pdfFormData.append('file', file);

          const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
            method: 'POST',
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': RAPIDAPI_HOST
            },
            body: pdfFormData
          });

          if (!response.ok) {
            throw new Error(`PDF extraction failed: ${response.statusText}`);
          }

          const result = await response.json();
          extractedText = result.text || '';
          processingStatus = 'completed';
        } catch (error) {
          console.error('Text extraction error:', error);
          processingStatus = 'failed';
          // Continue with empty text
        }
      }

      setProgress(80);

      // Step 3: Save to database
      const { error: dbError } = await supabase
        .from('document_content')
        .insert({
          client_id: clientId,
          document_id: documentId,
          content: extractedText || null,
          filename: file.name,
          file_type: file.type,
          storage_path: filePath,
          public_url: publicUrl,
          processing_status: processingStatus,
          metadata: {
            size: file.size,
            uploadedAt: new Date().toISOString(),
            extractedAt: processingStatus === 'completed' ? new Date().toISOString() : null,
            textLength: extractedText.length
          }
        });

      if (dbError) {
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      setProgress(100);

      return {
        success: true,
        documentId,
        extractedText,
        publicUrl,
        fileName: file.name,
        fileType: file.type
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name,
        fileType: file.type
      };
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadDocument,
    isUploading,
    progress,
    isError: false,
    error: null,
    reset: () => {
      setIsUploading(false);
      setProgress(0);
    }
  };
};
