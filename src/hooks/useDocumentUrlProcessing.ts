
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingResult, DocumentProcessingStatus } from "@/types/document-processing";
import { v4 as uuidv4 } from "uuid";

export const useDocumentUrlProcessing = (clientId: string) => {
  const [processingStatus, setProcessingStatus] = useState<DocumentProcessingStatus>({
    stage: 'complete',
    progress: 100
  });
  const [processingResult, setProcessingResult] = useState<DocumentProcessingResult | null>(null);

  const processDocumentUrl = async (url: string, options?: {
    shouldUseAI?: boolean,
    syncToAgent?: boolean,
    description?: string
  }): Promise<DocumentProcessingResult> => {
    try {
      setProcessingStatus({
        stage: 'uploading',
        progress: 10,
        message: 'Starting document processing...'
      });
      
      console.log(`Processing document URL: ${url}`);
      
      // Generate a unique ID for this document
      const documentId = uuidv4();
      const now = new Date().toISOString();
      const shouldUseAI = options?.shouldUseAI ?? true;
      
      // Initialize result
      let result: DocumentProcessingResult = {
        success: false,
        documentId,
        documentUrl: url,
        processed: 0,
        failed: 0
      };
      
      try {
        // First, call the fetch-url service to get metadata and content
        setProcessingStatus({
          stage: 'processing',
          progress: 20,
          message: 'Fetching URL content...'
        });
        
        const fetchResponse = await fetch(
          'https://mgjodiqecnnltsgorife.supabase.co/functions/v1/fetch-url',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
            },
            body: JSON.stringify({ url }),
          }
        );
        
        if (!fetchResponse.ok) {
          throw new Error(`Failed to fetch URL: ${await fetchResponse.text()}`);
        }
        
        const fetchResult = await fetchResponse.json();
        console.log('URL fetch result:', fetchResult);
        
        setProcessingStatus({
          stage: 'parsing',
          progress: 50,
          message: 'Analyzing document content...'
        });
        
        // Insert document record
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .insert({
            ai_agent_id: clientId,
            filename: fetchResult.title || url,
            type: 'url',
            status: 'completed',
            content: fetchResult.content || '',
            metadata: {
              url: url,
              title: fetchResult.title || '',
              description: options?.description || fetchResult.title || 'URL document'
            },
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();
        
        if (documentError) {
          throw new Error(`Failed to insert document record: ${documentError.message}`);
        }
        
        if (shouldUseAI) {
          result.aiProcessed = true;
        }
        
        result = {
          ...result,
          success: true,
          documentId: documentData.id,
          fileName: fetchResult.title || url,
          fileType: 'text/html',
          fileSize: fetchResult.content?.length || 0,
          extractedText: fetchResult.content || '',
          processed: 1,
          failed: 0,
        };
        
        // Sync to agent if requested
        if (options?.syncToAgent) {
          await syncDocumentToAgent(clientId, documentId, fetchResult.content || '', now);
        }
        
        setProcessingStatus({
          stage: 'complete',
          progress: 100,
          message: 'Document processed successfully'
        });
      } catch (error) {
        console.error('Error processing URL:', error);
        setProcessingStatus({
          stage: 'failed',
          progress: 0,
          message: `Failed to process URL: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error : new Error(String(error))
        });
        
        result.success = false;
        result.error = error instanceof Error ? error.message : String(error);
      }
      
      setProcessingResult(result);
      return result;
    } catch (error) {
      console.error('Error in processDocumentUrl:', error);
      setProcessingStatus({
        stage: 'failed',
        progress: 0,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      });
      
      const result: DocumentProcessingResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processed: 0,
        failed: 1
      };
      
      setProcessingResult(result);
      return result;
    }
  };
  
  const syncDocumentToAgent = async (clientId: string, documentId: string, content: string, timestamp: string) => {
    try {
      // Get or create agent_content record
      const { data: existingContent, error: fetchError } = await supabase
        .from('ai_agents')
        .select('id')
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
            content: content,
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
  
  return {
    processDocumentUrl,
    processingStatus,
    processingResult,
    isProcessing: processingStatus.stage !== 'complete' && processingStatus.stage !== 'failed'
  };
};
