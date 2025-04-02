
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentProcessingResult, DocumentProcessingStatus } from '@/types/document-processing';
import { convertDocument, processDocumentUrl, downloadFileFromUrl } from '@/utils/documentConverter';
import { updateWidgetSettings } from '@/services/widgetSettingsService';
import { DocumentMetadata } from '@/types/widget-settings';
import { processDocumentWithLlamaIndex } from '@/services/llamaIndexService';

export const useUnifiedDocumentUpload = (clientId: string) => {
  const [uploadStatus, setUploadStatus] = useState<DocumentProcessingStatus>({
    stage: 'uploading',
    progress: 0
  });
  const queryClient = useQueryClient();

  // Fetch existing documents for the client
  const { data: existingDocuments = [], refetch } = useQuery({
    queryKey: ['documents', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_links')
        .select('*')
        .eq('client_id', clientId)
        .is('deleted_at', null);

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 60000, // 1 minute
    enabled: !!clientId
  });

  // Handle file upload
  const uploadFile = async (file: File, options: {
    useAI?: boolean;
    folder?: string;
    description?: string;
  } = {}): Promise<DocumentProcessingResult | null> => {
    if (!clientId) {
      toast.error('Client ID is required for file upload');
      return null;
    }

    const documentId = uuidv4();
    const folder = options.folder || 'documents';
    const filePath = `${clientId}/${folder}/${documentId}-${file.name}`;

    try {
      setUploadStatus({
        stage: 'uploading',
        progress: 0,
        message: 'Uploading document...'
      });

      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('client-files')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      setUploadStatus({
        stage: 'processing',
        progress: 50,
        message: 'Processing document...'
      });

      // Use LlamaIndex for document processing if AI is enabled
      let extractedText = '';
      let aiProcessed = false;

      if (options.useAI) {
        try {
          setUploadStatus({
            stage: 'analyzing',
            progress: 70,
            message: 'Analyzing document with AI...'
          });

          const result = await processDocumentWithLlamaIndex(file, {
            shouldUseAI: true
          });

          if (result && result.parsed_content) {
            extractedText = result.parsed_content;
            aiProcessed = true;
          }
        } catch (error) {
          console.error('LlamaIndex processing failed:', error);
          toast.error('AI processing failed, using standard processing instead');
        }
      }

      // Create record in document_links table
      const documentRecord = {
        id: documentId,
        client_id: clientId,
        url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        description: options.description || '',
        extracted_text: extractedText,
        ai_processed: aiProcessed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('document_links')
        .insert(documentRecord);

      if (dbError) {
        throw new Error(`Failed to save document record: ${dbError.message}`);
      }

      // Prepare document metadata for widget settings
      const documentMetadata: DocumentMetadata = {
        documentId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        url: publicUrl,
        aiProcessed
      };

      // Update widget settings with the new document
      await updateWidgetDocuments(clientId, documentMetadata);

      // If AI processed, update the agent_content as well
      if (aiProcessed && extractedText) {
        await updateAgentContent(clientId, extractedText, file.name);
      }

      // Create processing result
      const result: DocumentProcessingResult = {
        documentId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: publicUrl,
        uploadDate: new Date().toISOString(),
        extractedText,
        aiProcessed,
        status: 'success'
      };

      setUploadStatus({
        stage: 'complete',
        progress: 100,
        message: 'Document uploaded successfully'
      });

      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
      refetch();

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during file upload';
      console.error('Document upload failed:', errorMessage);
      
      setUploadStatus({
        stage: 'failed',
        progress: 0,
        message: errorMessage,
        error: error instanceof Error ? error : new Error('Unknown error')
      });
      
      toast.error(`Document upload failed: ${errorMessage}`);
      return null;
    }
  };

  // Process a document URL
  const processDocumentUrl = async (url: string, options: {
    useAI?: boolean;
    documentType?: string;
    refreshRate?: number;
    description?: string;
  } = {}): Promise<DocumentProcessingResult | null> => {
    if (!clientId) {
      toast.error('Client ID is required for document URL processing');
      return null;
    }

    try {
      setUploadStatus({
        stage: 'processing',
        progress: 0,
        message: 'Processing document URL...'
      });

      // Process URL to get downloadable link
      const processResult = await processDocumentUrl(url);
      if (!processResult) {
        throw new Error('Failed to process document URL');
      }

      const { downloadUrl, fileName } = processResult;

      setUploadStatus({
        stage: 'uploading',
        progress: 25,
        message: 'Downloading document...'
      });

      // Download the file first
      const file = await downloadFileFromUrl(downloadUrl, fileName);
      if (!file) {
        throw new Error('Failed to download file from URL');
      }

      // Use the file upload function to handle the rest
      const result = await uploadFile(file, {
        useAI: options.useAI,
        folder: 'documents',
        description: options.description || url
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error processing document URL';
      console.error('Document URL processing failed:', errorMessage);
      
      setUploadStatus({
        stage: 'failed',
        progress: 0,
        message: errorMessage,
        error: error instanceof Error ? error : new Error('Unknown error')
      });
      
      toast.error(`Document URL processing failed: ${errorMessage}`);
      return null;
    }
  };

  // Helper to update widget settings with new document
  const updateWidgetDocuments = async (clientId: string, documentMetadata: DocumentMetadata) => {
    try {
      // Get current settings
      const { data: agentData, error: getError } = await supabase
        .from('ai_agents')
        .select('settings')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .maybeSingle();

      if (getError) {
        console.error('Error fetching agent settings:', getError);
        return;
      }

      // Parse settings
      let settings = {};
      if (agentData?.settings) {
        if (typeof agentData.settings === 'string') {
          try {
            settings = JSON.parse(agentData.settings);
          } catch (e) {
            console.error('Error parsing settings JSON:', e);
          }
        } else {
          settings = agentData.settings;
        }
      }

      // Update documents array
      const documents = Array.isArray(settings.documents) ? [...settings.documents] : [];
      documents.push(documentMetadata);

      // Update settings
      const updatedSettings = {
        ...settings,
        documents
      };

      // Save updated settings
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');

      if (updateError) {
        console.error('Error updating agent settings:', updateError);
      }
    } catch (error) {
      console.error('Failed to update widget documents:', error);
    }
  };

  // Helper to update agent content with extracted text
  const updateAgentContent = async (clientId: string, extractedText: string, fileName: string) => {
    try {
      // Get existing agent content
      const { data: existingContent, error: getError } = await supabase
        .from('agent_content')
        .select('id, content')
        .eq('client_id', clientId)
        .maybeSingle();

      if (getError) {
        console.error('Error fetching agent content:', getError);
      }

      // Format new content
      const documentHeader = `Document: ${fileName}\n`;
      const documentContent = `${documentHeader}\n${extractedText}\n\n`;

      if (existingContent?.id) {
        // Update existing content
        const updatedContent = `${existingContent.content || ''}\n${documentContent}`;
        
        const { error: updateError } = await supabase
          .from('agent_content')
          .update({
            content: updatedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContent.id);

        if (updateError) {
          console.error('Error updating agent content:', updateError);
        }
      } else {
        // Create new content record
        const { error: insertError } = await supabase
          .from('agent_content')
          .insert({
            client_id: clientId,
            content: documentContent,
            content_type: 'document',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating agent content:', insertError);
        }
      }
    } catch (error) {
      console.error('Failed to update agent content:', error);
    }
  };

  // Delete a document
  const deleteDocument = async (documentId: string): Promise<boolean> => {
    if (!clientId) {
      toast.error('Client ID is required for document deletion');
      return false;
    }

    try {
      // Soft delete the document record
      const { error: deleteError } = await supabase
        .from('document_links')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('client_id', clientId);

      if (deleteError) {
        throw new Error(`Failed to delete document record: ${deleteError.message}`);
      }

      // Update widget settings to remove the document
      try {
        // Get current settings
        const { data: agentData, error: getError } = await supabase
          .from('ai_agents')
          .select('settings')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .maybeSingle();

        if (getError) {
          console.error('Error fetching agent settings:', getError);
        } else if (agentData?.settings) {
          // Parse settings
          let settings = {};
          if (typeof agentData.settings === 'string') {
            try {
              settings = JSON.parse(agentData.settings);
            } catch (e) {
              console.error('Error parsing settings JSON:', e);
            }
          } else {
            settings = agentData.settings;
          }

          // Update documents array
          const documents = Array.isArray(settings.documents) 
            ? settings.documents.filter((doc: DocumentMetadata) => doc.documentId !== documentId)
            : [];

          // Update settings
          const updatedSettings = {
            ...settings,
            documents
          };

          // Save updated settings
          const { error: updateError } = await supabase
            .from('ai_agents')
            .update({
              settings: updatedSettings,
              updated_at: new Date().toISOString()
            })
            .eq('client_id', clientId)
            .eq('interaction_type', 'config');

          if (updateError) {
            console.error('Error updating agent settings:', updateError);
          }
        }
      } catch (error) {
        console.error('Failed to update widget documents:', error);
      }

      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
      refetch();

      toast.success('Document deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during document deletion';
      console.error('Document deletion failed:', errorMessage);
      toast.error(`Document deletion failed: ${errorMessage}`);
      return false;
    }
  };

  return {
    uploadFile,
    processDocumentUrl,
    deleteDocument,
    uploadStatus,
    existingDocuments,
    refetchDocuments: refetch
  };
};
