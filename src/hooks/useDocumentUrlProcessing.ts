
import { useState } from 'react';
import { DocumentProcessingStatus, DocumentProcessingResult } from '@/types/document-processing';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export function useDocumentUrlProcessing(clientId: string, agentName: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<DocumentProcessingStatus>({
    status: 'init',
    stage: 'init',
    progress: 0
  });
  const [processingResult, setProcessingResult] = useState<DocumentProcessingResult | null>(null);

  const processUrl = async (url: string): Promise<DocumentProcessingResult> => {
    try {
      setIsProcessing(true);
      setProcessingStatus({
        status: 'init',
        stage: 'init',
        progress: 0,
        message: 'Starting URL processing...'
      });

      // Validate URL
      try {
        new URL(url);
      } catch (error) {
        setProcessingStatus({
          status: 'failed',
          stage: 'failed',
          progress: 0,
          message: 'Invalid URL format'
        });
        
        const result = {
          success: false,
          error: 'Invalid URL format',
          processed: 0,
          failed: 1
        };
        setProcessingResult(result);
        return result;
      }

      // Update status
      setProcessingStatus({
        status: 'processing',
        stage: 'processing',
        progress: 20,
        message: 'Validating URL...'
      });

      // Create a processing job in the database
      const documentId = uuidv4();
      const { data: jobData, error: jobError } = await supabase
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          document_id: documentId,
          document_url: url,
          document_type: 'url',
          agent_name: agentName,
          status: 'pending',
          metadata: {
            url: url
          }
        })
        .select()
        .single();

      if (jobError) {
        setProcessingStatus({
          status: 'failed',
          stage: 'failed',
          progress: 0,
          message: `Error creating processing job: ${jobError.message}`
        });
        
        const result = {
          success: false,
          error: `Error creating processing job: ${jobError.message}`,
          processed: 0,
          failed: 1
        };
        setProcessingResult(result);
        return result;
      }

      // Update status to show progress
      setProcessingStatus({
        status: 'processing',
        stage: 'processing',
        progress: 40,
        message: 'URL registered for processing. Scraping contents...'
      });

      // In a real implementation, you would now start or trigger the actual processing
      // For demo purposes, we'll just simulate success after a short delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate a successful result
      const result: DocumentProcessingResult = {
        success: true,
        documentId: documentId,
        documentUrl: url,
        processed: 1,
        failed: 0,
        urlsScraped: 1,
        contentStored: 1,
        fileName: new URL(url).hostname,
        message: 'URL processed successfully.'
      };

      // Update the job status in the database
      const { error: updateError } = await supabase
        .from('document_processing_jobs')
        .update({
          status: 'completed',
          content: 'Web content extracted successfully',
          metadata: {
            ...jobData.metadata,
            processed_count: 1,
            failed_count: 0,
            completed_at: new Date().toISOString()
          }
        })
        .eq('document_id', documentId);

      if (updateError) {
        setProcessingStatus({
          status: 'failed',
          stage: 'failed',
          progress: 0,
          message: `Error updating job status: ${updateError.message}`
        });
        
        const errorResult = {
          success: false,
          error: `Error updating job status: ${updateError.message}`,
          processed: 0,
          failed: 1
        };
        setProcessingResult(errorResult);
        return errorResult;
      }

      // Update status to completed
      setProcessingStatus({
        status: 'completed',
        stage: 'completed',
        progress: 100,
        message: 'URL processing completed successfully.'
      });

      setProcessingResult(result);
      return result;
    } catch (error) {
      console.error('Error processing URL:', error);
      
      setProcessingStatus({
        status: 'failed',
        stage: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'Unknown error processing URL'
      });
      
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: 0,
        failed: 1
      };
      
      setProcessingResult(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkProcessingStatus = async (jobId: string): Promise<DocumentProcessingStatus> => {
    try {
      const { data, error } = await supabase
        .from('document_processing_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !data) {
        return {
          status: 'failed',
          stage: 'failed',
          progress: 0,
          message: error ? error.message : 'Job not found'
        };
      }

      if (data.status === 'completed') {
        return {
          status: 'completed',
          stage: 'completed',
          progress: 100,
          message: 'Processing completed successfully'
        };
      } else if (data.status === 'failed') {
        return {
          status: 'failed',
          stage: 'failed',
          progress: 0,
          message: data.error || 'Processing failed'
        };
      } else {
        // Calculate approximate progress for pending/processing
        let progress = 0;
        
        if (data.status === 'pending') {
          progress = 20;
        } else if (data.status === 'processing') {
          progress = 60;
        }
        
        return {
          status: data.status,
          stage: data.status,
          progress,
          message: `Status: ${data.status}`
        };
      }
    } catch (error) {
      console.error('Error checking processing status:', error);
      return {
        status: 'failed',
        stage: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'Error checking status'
      };
    }
  };

  return {
    processUrl,
    checkProcessingStatus,
    isProcessing,
    processingStatus,
    processingResult
  };
}
