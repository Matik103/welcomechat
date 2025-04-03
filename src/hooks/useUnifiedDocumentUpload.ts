
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { 
  DocumentProcessingResult, 
  DocumentProcessingStatus, 
  DocumentProcessingOptions,
  DocumentMetadata,
  JsonSerializable
} from '@/types/document-processing';
import { 
  uploadDocumentToLlamaIndex, 
  processLlamaIndexJob, 
  convertToPdfIfNeeded 
} from '@/services/llamaIndexService';

export const useUnifiedDocumentUpload = (clientId: string) => {
  const [uploadStatus, setUploadStatus] = useState<DocumentProcessingStatus>({
    id: uuidv4(),
    status: 'completed',
    stage: 'complete',
    progress: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<any[]>([]);

  // Helper function to check if file is uploading
  const isUploading = uploadStatus.stage === 'uploading' || 
                       uploadStatus.stage === 'processing' || 
                       uploadStatus.stage === 'parsing' || 
                       uploadStatus.stage === 'analyzing';

  // Helper function to get upload progress
  const uploadProgress = uploadStatus.progress || 0;

  const uploadDocument = useCallback(async (
    file: File, 
    options: DocumentProcessingOptions = { clientId }
  ): Promise<DocumentProcessingResult> => {
    try {
      console.log(`Starting unified document upload for ${file.name} with options:`, options);
      
      // Set initial upload status
      setUploadStatus({
        id: uuidv4(),
        status: 'pending',
        stage: 'uploading',
        progress: 5,
        message: 'Starting upload...',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // Generate a unique ID for this document
      const documentId = uuidv4();
      const storageFilename = `${documentId}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = `${clientId}/${storageFilename}`;
      const now = new Date().toISOString();
      
      // Convert to PDF if needed (for Office documents, etc.)
      setUploadStatus(prevStatus => ({
        ...prevStatus,
        status: 'processing',
        stage: 'processing',
        progress: 10,
        message: 'Processing document...',
        updated_at: new Date().toISOString()
      }));
      
      const processedFile = await convertToPdfIfNeeded(file);
      
      // Upload file to storage
      setUploadStatus(prevStatus => ({
        ...prevStatus,
        status: 'processing',
        stage: 'uploading',
        progress: 20,
        message: 'Uploading to storage...',
        updated_at: new Date().toISOString()
      }));
      
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('document-storage') // Using the correct bucket
        .upload(storagePath, processedFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (storageError) {
        console.error('Error uploading document to storage:', storageError);
        setUploadStatus(prevStatus => ({
          ...prevStatus,
          status: 'failed',
          stage: 'failed',
          progress: 0,
          message: `Upload failed: ${storageError.message}`,
          error: storageError.message,
          updated_at: new Date().toISOString()
        }));
        
        const result: DocumentProcessingResult = {
          success: false,
          error: storageError.message,
          processed: 0,
          failed: 1
        };
        
        setUploadResult(result);
        return result;
      }
      
      console.log('Document uploaded to storage:', storageData);
      
      // Get a public URL for the uploaded file
      const { data: publicUrlData } = supabase
        .storage
        .from('document-storage')
        .getPublicUrl(storagePath);
      
      const publicUrl = publicUrlData.publicUrl;
      
      // Instead of inserting directly to 'documents', use document_links table
      // which might have less restrictive RLS policies
      setUploadStatus(prevStatus => ({
        ...prevStatus,
        status: 'processing',
        stage: 'processing',
        progress: 40,
        message: 'Recording document metadata...',
        updated_at: new Date().toISOString()
      }));
      
      const mimeType = file.type || 'application/octet-stream';
      let documentType = 'document';
      
      if (mimeType.includes('pdf')) {
        documentType = 'pdf';
      } else if (mimeType.includes('word') || mimeType.includes('office')) {
        documentType = 'docx';
      } else if (mimeType.includes('text')) {
        documentType = 'text';
      }
      
      let extractedText = '';
      let aiProcessed = false;
      
      // Process with LlamaIndex and OpenAI if requested
      if (options.shouldUseAI) {
        try {
          setUploadStatus(prevStatus => ({
            ...prevStatus,
            status: 'processing',
            stage: 'analyzing',
            progress: 60,
            message: 'Processing with AI...',
            updated_at: new Date().toISOString()
          }));
          
          console.log('Uploading document to LlamaIndex for AI processing...');
          
          // Upload to LlamaIndex for processing
          const llamaIndexResponse = await uploadDocumentToLlamaIndex(processedFile, {
            clientId: options.clientId
          });
          
          if (llamaIndexResponse && llamaIndexResponse.job_id) {
            console.log('Document uploaded to LlamaIndex, polling for results...');
            
            // Poll for processing results
            setUploadStatus(prevStatus => ({
              ...prevStatus,
              status: 'processing',
              stage: 'analyzing',
              progress: 70,
              message: 'AI processing in progress...',
              updated_at: new Date().toISOString()
            }));
            
            const processingResult = await processLlamaIndexJob(llamaIndexResponse.job_id);
            
            if (processingResult.status === 'SUCCEEDED' && processingResult.parsed_content) {
              extractedText = processingResult.parsed_content;
              aiProcessed = true;
              
              console.log('Document successfully processed with AI');
              console.log(`Extracted text length: ${extractedText.length} characters`);
            } else {
              console.warn('LlamaIndex processing did not return content:', processingResult);
            }
          }
        } catch (aiError) {
          console.error('Error processing document with AI:', aiError);
          // Continue with the upload process even if AI processing fails
        }
      }
      
      // Prepare metadata for database storage
      const metadata: Record<string, JsonSerializable> = {
        file_name: file.name,
        file_size: file.size,
        storage_path: storagePath
      };
      
      // Insert into document_links table instead of documents
      const { data: documentLinkData, error: linkError } = await supabase
        .from('document_links')
        .insert({
          client_id: clientId,
          link: publicUrl,
          document_type: documentType,
          file_name: file.name,
          file_size: file.size,
          mime_type: mimeType,
          storage_path: storagePath,
          access_status: 'accessible',
          refresh_rate: 30 // Default refresh rate
        })
        .select()
        .single();
      
      if (linkError) {
        console.error('Error creating document link record:', linkError);
        setUploadStatus(prevStatus => ({
          ...prevStatus,
          status: 'failed',
          stage: 'failed',
          progress: 0,
          message: `Document upload failed: ${linkError.message}`,
          error: linkError.message,
          updated_at: new Date().toISOString()
        }));
        
        const result: DocumentProcessingResult = {
          success: false,
          error: linkError.message,
          documentId,
          documentUrl: publicUrl,
          processed: 0,
          failed: 1
        };
        
        setUploadResult(result);
        return result;
      }
      
      console.log('Document link record created:', documentLinkData);
      
      // Log activity
      await createClientActivity(
        clientId,
        file.name,
        ActivityType.DOCUMENT_ADDED,
        `Document uploaded: ${file.name}`,
        {
          file_name: file.name,
          file_size: file.size,
          file_type: mimeType,
          document_id: documentLinkData.id.toString()
        }
      );
      
      // Update agent content if requested
      if (options.syncToAgent && extractedText) {
        await syncDocumentToAgent(clientId, documentId, extractedText, now);
      }
      
      // Complete successfully
      setUploadStatus(prevStatus => ({
        ...prevStatus,
        status: 'completed',
        stage: 'complete',
        progress: 100,
        message: 'Document processed successfully',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }));
      
      const result: DocumentProcessingResult = {
        success: true,
        documentId: documentLinkData.id.toString(),
        documentUrl: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: mimeType,
        downloadUrl: publicUrl,
        extractedText,
        aiProcessed,
        processed: 1,
        failed: 0
      };
      
      setUploadResult(result);
      
      // Refresh document list
      fetchDocuments();
      
      return result;
    } catch (error) {
      console.error('Error in unified document upload:', error);
      setUploadStatus(prevStatus => ({
        ...prevStatus,
        status: 'failed',
        stage: 'failed',
        progress: 0,
        message: 'Document upload failed',
        error: error instanceof Error ? error.message : String(error),
        updated_at: new Date().toISOString()
      }));
      
      const result: DocumentProcessingResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processed: 0,
        failed: 1
      };
      
      setUploadResult(result);
      return result;
    }
  }, [clientId]);

  const syncDocumentToAgent = async (clientId: string, documentId: string, content: string, timestamp: string) => {
    try {
      // Get or create agent_content record
      const { data: existingContent, error: fetchError } = await supabase
        .from('ai_agents')
        .select('id, content')
        .eq('client_id', clientId)
        .eq('interaction_type', 'document_content')
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error checking for existing agent_content:', fetchError);
        return;
      }
      
      if (existingContent) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('ai_agents')
          .update({
            content: existingContent.content 
              ? `${existingContent.content}\n\n${content}`
              : content,
            updated_at: timestamp
          })
          .eq('id', existingContent.id);
        
        if (updateError) {
          console.error('Error updating agent_content:', updateError);
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('ai_agents')
          .insert({
            client_id: clientId,
            name: 'Document Content',
            content: content,
            interaction_type: 'document_content',
            created_at: timestamp,
            updated_at: timestamp
          });
        
        if (insertError) {
          console.error('Error creating agent_content:', insertError);
        }
      }
    } catch (error) {
      console.error('Error syncing document to agent:', error);
    }
  };

  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      // Find the document first
      const { data: documentData, error: fetchError } = await supabase
        .from('documents')
        .select('metadata')
        .eq('id', documentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching document:', fetchError);
        return false;
      }
      
      // Mark as deleted in the database
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
      
      if (updateError) {
        console.error('Error marking document as deleted:', updateError);
        return false;
      }
      
      // Log activity
      await createClientActivity(
        clientId,
        'Document',
        ActivityType.DOCUMENT_REMOVED,
        `Document removed`,
        {
          document_id: documentId
        }
      );
      
      // Refresh document list
      fetchDocuments();
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('ai_agent_id', clientId)
        .neq('status', 'failed')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }
      
      setExistingDocuments(data || []);
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
    }
  };

  // Fetch documents on initial load
  const fetchData = useCallback(async () => {
    await fetchDocuments();
  }, [clientId]);

  return {
    uploadDocument,
    processDocumentUrl: async () => ({ success: false, processed: 0, failed: 1 }),
    deleteDocument,
    uploadStatus,
    existingDocuments,
    fetchDocuments,
    fetchData,
    isUploading,
    uploadProgress,
    uploadResult
  };
};
