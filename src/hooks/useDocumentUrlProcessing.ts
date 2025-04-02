
import { useState } from 'react';
import { DocumentProcessingStatus, DocumentProcessingResult } from '@/types/document-processing';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export function useDocumentUrlProcessing(clientId: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<DocumentProcessingStatus>({
    status: 'pending',
    stage: 'init',
    progress: 0
  });
  const [processingResult, setProcessingResult] = useState<DocumentProcessingResult | null>(null);

  const processDocumentUrl = async (
    url: string, 
    documentType: string = 'url',
    agentName?: string
  ): Promise<DocumentProcessingResult> => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingResult(null);
      setProcessingStatus({
        status: 'pending',
        stage: 'init',
        progress: 0,
        message: 'Starting URL processing...'
      });
      
      // Validate URL
      try {
        new URL(url);
      } catch (error) {
        throw new Error('Invalid URL format');
      }
      
      // Step 1: Create document processing job
      setProcessingStatus({
        status: 'processing',
        stage: 'processing',
        progress: 20,
        message: 'Initiating URL processing...'
      });
      
      const documentId = uuidv4();
      const { error: createError } = await supabase.from('document_processing_jobs').insert({
        client_id: clientId,
        document_id: documentId,
        document_url: url,
        document_type: documentType,
        agent_name: agentName || '',
        status: 'pending',
        metadata: {
          processing_started: new Date().toISOString()
        }
      });
      
      if (createError) throw new Error(`Error creating processing job: ${createError.message}`);
      
      setProcessingProgress(30);
      setProcessingStatus({
        status: 'processing',
        stage: 'processing',
        progress: 30,
        message: 'Fetching URL content...'
      });
      
      // Step 2: Process URL through edge function or direct fetch
      let content = '';
      try {
        // For simplicity, we'll use a direct fetch here
        // In production, you might want to use an edge function for more complex processing
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        
        // Get content based on content type
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          content = await response.text();
        } else if (contentType.includes('application/json')) {
          const json = await response.json();
          content = JSON.stringify(json, null, 2);
        } else {
          content = await response.text();
        }
      } catch (fetchError) {
        console.error('Error fetching URL:', fetchError);
        
        // Update the job with error
        await supabase.from('document_processing_jobs').update({
          status: 'failed',
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error fetching URL',
          updated_at: new Date().toISOString()
        }).eq('document_id', documentId);
        
        throw new Error(`Error fetching URL content: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
      
      setProcessingProgress(70);
      setProcessingStatus({
        status: 'processing',
        stage: 'storing',
        progress: 70,
        message: 'Storing URL content...'
      });
      
      // Step 3: Update the job with the content
      const { error: updateError } = await supabase.from('document_processing_jobs').update({
        content,
        status: 'completed',
        updated_at: new Date().toISOString(),
        metadata: {
          processing_completed: new Date().toISOString(),
          content_length: content.length,
          url
        }
      }).eq('document_id', documentId);
      
      if (updateError) {
        throw new Error(`Error updating job with content: ${updateError.message}`);
      }
      
      setProcessingProgress(100);
      setProcessingStatus({
        status: 'completed',
        stage: 'completed',
        progress: 100,
        message: 'URL processed successfully!'
      });
      
      const result: DocumentProcessingResult = {
        success: true,
        processed: 1,
        failed: 0,
        documentId,
        documentUrl: url,
        extractedText: content
      };
      
      setProcessingResult(result);
      return result;
    } catch (error) {
      console.error('Error processing document URL:', error);
      
      setProcessingStatus({
        status: 'failed',
        stage: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'URL processing failed'
      });
      
      const result: DocumentProcessingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in URL processing',
        processed: 0,
        failed: 1
      };
      
      setProcessingResult(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processDocumentUrl,
    isProcessing,
    processingProgress,
    processingStatus,
    processingResult
  };
}
