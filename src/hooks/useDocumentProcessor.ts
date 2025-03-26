
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult, DocumentProcessingOptions } from '@/types/document-processing';
import { v4 as uuidv4 } from 'uuid';

export function useDocumentProcessor(clientId?: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processDocument = async (
    documentUrl: string,
    options: Partial<DocumentProcessingOptions> = {}
  ): Promise<DocumentProcessingResult> => {
    if (!clientId && !options.clientId) {
      return {
        success: false,
        error: 'Client ID is required',
        status: 'failed'
      };
    }

    const effectiveClientId = options.clientId || clientId;
    const documentType = options.documentType || 'document';
    const agentName = options.agentName || 'AI Assistant';

    setIsProcessing(true);
    setProgress(0);

    try {
      // Generate a processing ID
      const processingId = uuidv4();
      
      // Create a processing record
      const { data, error } = await supabase
        .from('document_processing')
        .insert({
          id: processingId,
          document_url: documentUrl,
          client_id: effectiveClientId,
          agent_name: agentName,
          document_type: documentType,
          status: 'pending',
          started_at: new Date().toISOString(),
          document_id: uuidv4(), // Generate a document ID
          metadata: {
            source: 'manual',
            user_initiated: true
          }
        })
        .select();

      if (error) {
        throw error;
      }

      // For MVP, just simulate processing
      setProgress(50);
      
      // Update the record to show completion
      await supabase
        .from('document_processing')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', processingId);
      
      setProgress(100);
      
      return {
        success: true,
        documentId: processingId,
        processed: 1,
        failed: 0,
        status: 'completed'
      };
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processDocument,
    isProcessing,
    progress
  };
}
