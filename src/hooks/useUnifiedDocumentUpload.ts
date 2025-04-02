
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult } from '@/types/document-processing';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { v4 as uuidv4 } from 'uuid';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { getWidgetSettings, updateWidgetSettings } from '@/services/widgetSettingsService';
import { convertToPdfIfNeeded } from '@/utils/documentConverter';
import { processDocumentWithLlamaIndex } from '@/services/llamaIndexService';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';

interface SyncOptions {
  syncToAgent: boolean;
  syncToProfile: boolean;
  syncToWidgetSettings: boolean;
  useLlamaIndex: boolean;
}

// Default sync options
const defaultSyncOptions: SyncOptions = {
  syncToAgent: true,
  syncToProfile: true,
  syncToWidgetSettings: true,
  useLlamaIndex: true
};

export function useUnifiedDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);

  /**
   * Process text content directly without external processing
   * @param content Text content to process
   * @param fileName The name of the document
   * @returns Processing result with extracted text
   */
  const processTextContent = async (content: string, fileName: string): Promise<DocumentProcessingResult> => {
    try {
      // Generate a document ID
      const documentId = uuidv4();
      
      console.log(`Processing text content with length ${content.length} for document ${fileName}`);
      
      return {
        success: true,
        documentId,
        processed: 1,
        failed: 0,
        extractedText: content
      };
    } catch (error) {
      console.error('Error processing text content:', error);
      throw error;
    }
  };

  /**
   * Process a document using appropriate method based on file type
   * @param file The file to process
   * @returns Processing result with extracted text
   */
  const processDocument = async (file: File): Promise<DocumentProcessingResult> => {
    try {
      // Check if we should use LlamaIndex (if API keys are available)
      const canUseLlamaIndex = !!LLAMA_CLOUD_API_KEY && !!OPENAI_API_KEY;
      
      // If we have plain text or CSV, use simple processing
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        const text = await file.text();
        return processTextContent(text, file.name);
      }
      
      // If we can use LlamaIndex, use it for PDF and other document types
      if (canUseLlamaIndex) {
        console.log('Using LlamaIndex to process document:', file.name);
        
        try {
          // Convert to PDF if needed
          const pdfFile = await convertToPdfIfNeeded(file);
          
          // Process with LlamaIndex
          const { text, metadata } = await processDocumentWithLlamaIndex(pdfFile);
          
          return {
            success: true,
            documentId: uuidv4(),
            processed: 1,
            failed: 0,
            extractedText: text,
            message: 'Document processed with LlamaIndex AI',
            metadata
          };
        } catch (llamaError) {
          console.error('LlamaIndex processing failed, falling back to basic handling:', llamaError);
          
          // If LlamaIndex fails, fall back to basic processing
          if (file.type === 'application/pdf') {
            return {
              success: true,
              documentId: uuidv4(),
              processed: 0,
              failed: 1,
              error: 'PDF processing failed. LlamaIndex error: ' + (llamaError instanceof Error ? llamaError.message : String(llamaError)),
              extractedText: `Uploaded document: ${file.name}. Content could not be extracted.`
            };
          }
        }
      }
      
      // For other files or if LlamaIndex is not available, return basic metadata
      return {
        success: true,
        documentId: uuidv4(),
        processed: 0,
        failed: 0,
        extractedText: `Document uploaded: ${file.name}. Content extraction not supported for this file type without LlamaIndex integration.`
      };
    } catch (error) {
      console.error('Error in document processing:', error);
      return {
        success: false,
        documentId: uuidv4(),
        processed: 0,
        failed: 1,
        error: 'Document processing error: ' + (error instanceof Error ? error.message : String(error))
      };
    }
  };

  /**
   * Upload and process a document file
   * @param file The file to upload and process
   * @param options Options for synchronizing the document with different services
   * @returns Promise resolving when the document is processed
   */
  const uploadDocument = async (
    file: File, 
    options: Partial<SyncOptions> = {}
  ): Promise<void> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const mergedOptions = { ...defaultSyncOptions, ...options };
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress during upload/processing
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);

      try {
        // 1. Get the agent name - ensure it's fetched properly
        const { data: agentData, error: agentError } = await supabase
          .from('ai_agents')
          .select('name')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .limit(1)
          .maybeSingle();
        
        if (agentError) {
          console.error('Failed to get agent name:', agentError);
          throw new Error(`Failed to get agent name: ${agentError.message}`);
        }
        
        if (!agentData || !agentData.name) {
          throw new Error('Agent name not found for this client');
        }
        
        const agentName = agentData.name;
        console.log("Using agent name for document upload:", agentName);

        // 2. Upload the file to storage
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `${clientId}/${fileName}`;
        
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

        // 3. Process the document using appropriate method
        console.log('Processing document:', file.name, 'using AI:', mergedOptions.useLlamaIndex);
        const result = await processDocument(file);
        
        // Add the document URL to the result
        result.documentUrl = publicUrl;

        // 4. Synchronize document data with agent content if requested
        if (mergedOptions.syncToAgent && result.extractedText) {
          try {
            // Get the existing agent content
            const { data: agentContent, error: contentError } = await supabase
              .from('ai_agents')
              .select('content')
              .eq('client_id', clientId)
              .eq('interaction_type', 'config')
              .limit(1)
              .single();
            
            if (contentError) {
              console.error('Error fetching agent content:', contentError);
            } else if (agentContent) {
              // Append the new document content
              const existingContent = agentContent.content || '';
              const updatedContent = `${existingContent}\n\n--- Document: ${file.name} ---\n${result.extractedText}`;
              
              // Update the agent's content
              const { error: updateError } = await supabase
                .from('ai_agents')
                .update({ content: updatedContent })
                .eq('client_id', clientId)
                .eq('interaction_type', 'config');
              
              if (updateError) {
                console.error('Error updating agent content:', updateError);
              } else {
                console.log('Successfully updated agent content with document data');
              }
            }
          } catch (syncError) {
            console.error('Error synchronizing document with agent content:', syncError);
          }
        }

        // 5. Update user profile with document data if requested
        if (mergedOptions.syncToProfile) {
          try {
            // Create a document processing job record
            const { error: jobError } = await supabase
              .from('document_processing_jobs')
              .insert({
                client_id: clientId,
                agent_name: agentName,
                document_url: publicUrl,
                document_type: file.type.includes('pdf') ? 'pdf' : 'document',
                document_id: result.documentId,
                status: 'completed',
                content: result.extractedText || '',
                metadata: {
                  file_name: file.name,
                  file_size: file.size,
                  storage_path: filePath,
                  processed_sections: result.processed,
                  failed_sections: result.failed,
                  processing_method: mergedOptions.useLlamaIndex ? 'llamaindex' : 'basic'
                }
              });
            
            if (jobError) {
              console.error('Error creating document processing job:', jobError);
            } else {
              console.log('Successfully created document processing job record');
            }
          } catch (profileError) {
            console.error('Error updating profile with document data:', profileError);
          }
        }
        
        // 6. Update widget settings if requested
        if (mergedOptions.syncToWidgetSettings) {
          try {
            // Use the imported service functions instead of RPC calls
            const currentSettings = await getWidgetSettings(clientId);
            
            // Create document summary for widget settings
            const docSummary = {
              documentId: result.documentId,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadDate: new Date().toISOString(),
              url: publicUrl,
              aiProcessed: mergedOptions.useLlamaIndex && result.processed > 0
            };
            
            // Add document to widget settings
            const updatedSettings = {
              ...currentSettings,
              documents: [...(currentSettings.documents || []), docSummary]
            };
            
            // Update settings
            await updateWidgetSettings(clientId, updatedSettings);
            console.log('Widget settings updated with document information');
            
          } catch (widgetError) {
            console.error('Error updating widget settings with document data:', widgetError);
          }
        }

        // 7. Track client activity
        await createClientActivity(
          clientId,
          agentName,
          ActivityType.DOCUMENT_ADDED,
          `Document uploaded: ${file.name}`,
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            processed_sections: result.processed,
            failed_sections: result.failed,
            document_id: result.documentId,
            ai_processed: mergedOptions.useLlamaIndex && result.processed > 0
          }
        );

        // 8. Clear the progress interval and set final result
        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadResult(result);
        
        toast.success('Document uploaded and processed successfully');
      } catch (processingError) {
        console.error('Error processing document:', processingError);
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        const errorMessage = processingError instanceof Error 
          ? processingError.message 
          : 'Unknown processing error';
        
        setUploadResult({
          success: false,
          error: errorMessage,
          processed: 0,
          failed: 1,
          documentId: uuidv4()
        });
        
        throw processingError;
      }
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error uploading document: ${errorMessage}`);
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
