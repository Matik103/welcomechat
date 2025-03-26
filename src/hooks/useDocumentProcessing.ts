
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { processDocument } from '@/services/documentProcessingService';

export function useDocumentProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const processDocumentUrl = async (clientId: string, documentUrl: string, documentType: string) => {
    if (!clientId || !documentUrl) {
      return {
        success: false,
        error: 'Missing required parameters'
      };
    }
    
    setIsProcessing(true);
    setProgress(10);
    
    try {
      // Generate a document ID
      const documentId = uuidv4();
      
      setProgress(30);
      
      // Call the document processing service
      const result = await processDocument(clientId, documentUrl, documentType, documentId);
      
      setProgress(100);
      
      return {
        success: true,
        documentId,
        ...result
      };
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    processDocumentUrl,
    isProcessing,
    progress
  };
}
