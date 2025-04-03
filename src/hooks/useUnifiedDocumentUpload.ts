
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { v4 as uuidv4 } from 'uuid';
import { DocumentProcessingResult } from '@/types/document-processing';
import { uploadToOpenAIAssistant } from '@/services/openaiAssistantService';

interface UploadOptions {
  clientId?: string;
  shouldUseAI?: boolean;
  syncToAgent?: boolean;
  syncToProfile?: boolean;
  syncToWidgetSettings?: boolean;
}

export function useUnifiedDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);

  /**
   * Unified document upload function that handles multiple destinations
   */
  const uploadDocument = async (file: File, options: UploadOptions = {}): Promise<DocumentProcessingResult> => {
    if (!clientId && !options.clientId) {
      throw new Error('Client ID is required');
    }

    const effectiveClientId = options.clientId || clientId;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);
    
    try {
      // 1. Get the agent name for this client
      setUploadProgress(5);
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('name, openai_assistant_id')
        .eq('client_id', effectiveClientId)
        .eq('interaction_type', 'config')
        .limit(1)
        .maybeSingle();
      
      if (agentError) {
        console.error('Failed to get agent name:', agentError);
        throw new Error(`Failed to get agent name: ${agentError.message}`);
      }
      
      const agentName = agentData?.name || 'AI Assistant';
      const existingAssistantId = agentData?.openai_assistant_id;
      console.log("Using agent name for document upload:", agentName);
      setUploadProgress(10);
      
      // 2. Upload the file to storage
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${effectiveClientId}/${fileName}`;
      
      setUploadProgress(15);
      // Upload the original file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);
      
      console.log(`File uploaded successfully. Public URL: ${publicUrl}`);
      setUploadProgress(40);
      
      // 3. Process the document with OpenAI's built-in file handling
      if (options.shouldUseAI !== false) {
        setUploadProgress(50);
        console.log("Uploading document to OpenAI Assistant:", file.name);
        
        const openAIResult = await uploadToOpenAIAssistant(
          effectiveClientId,
          agentName,
          file,
          existingAssistantId
        );
        
        if (!openAIResult.success) {
          console.error("Error uploading to OpenAI:", openAIResult.error);
          toast.error(`Error processing with OpenAI: ${openAIResult.error}`);
          // Continue despite the error
        } else {
          console.log("Successfully uploaded to OpenAI Assistant");
        }
        
        setUploadProgress(80);
      }
      
      // 4. Create a document link record
      const { error: linkError } = await supabase
        .from('document_links')
        .insert({
          client_id: effectiveClientId,
          document_type: file.type.includes('pdf') ? 'pdf' : 'document',
          link: publicUrl,
          storage_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          openai_file_id: openAIResult?.fileId || null
        });
      
      if (linkError) {
        console.error('Error creating document link record:', linkError);
        throw new Error(`Failed to create document record: ${linkError.message}`);
      }
      
      setUploadProgress(100);
      
      // 5. Prepare success result
      const result: DocumentProcessingResult = {
        success: true,
        processed: 1,
        failed: 0,
        documentId: uuidv4(),
        documentUrl: publicUrl,
        extractedText: 'Document uploaded successfully to OpenAI Assistant'
      };
      
      setUploadResult(result);
      toast.success(`Document "${file.name}" uploaded successfully`);
      return result;
      
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorResult: DocumentProcessingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: 0,
        failed: 1
      };
      setUploadResult(errorResult);
      toast.error(`Upload failed: ${errorResult.error}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadResult
  };
}
