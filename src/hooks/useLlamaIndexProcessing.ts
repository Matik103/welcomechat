
import { useState } from 'react';
import { DocumentProcessingService } from '@/utils/DocumentProcessingService';
import { DocumentProcessingResult } from '@/types/document-processing';
import { toast } from 'sonner';

export function useLlamaIndexProcessing(clientId: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DocumentProcessingResult | null>(null);

  const processDocument = async (file: File): Promise<DocumentProcessingResult> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);
      
      // Process document with LlamaIndex
      const result = await DocumentProcessingService.processDocument(file, clientId);
      
      // Clear the interval and set final progress
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success) {
        setResult(result);
        toast.success('Document processed successfully');
      } else {
        setResult(result);
        toast.error(result.error || 'Failed to process document');
      }
      
      return result;
    } catch (error) {
      console.error('Error processing document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const failResult: DocumentProcessingResult = {
        success: false,
        error: errorMessage,
        processed: 0,
        failed: 1
      };
      
      setResult(failResult);
      toast.error(`Error processing document: ${errorMessage}`);
      
      return failResult;
    } finally {
      setIsProcessing(false);
    }
  };

  const processDocumentUrl = async (url: string): Promise<DocumentProcessingResult> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);
      
      // Process document URL with LlamaIndex
      const result = await DocumentProcessingService.processDocumentUrl(url, clientId);
      
      // Clear the interval and set final progress
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success) {
        setResult(result);
        toast.success('Document URL processed successfully');
      } else {
        setResult(result);
        toast.error(result.error || 'Failed to process document URL');
      }
      
      return result;
    } catch (error) {
      console.error('Error processing document URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const failResult: DocumentProcessingResult = {
        success: false,
        error: errorMessage,
        processed: 0,
        failed: 1
      };
      
      setResult(failResult);
      toast.error(`Error processing document URL: ${errorMessage}`);
      
      return failResult;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processDocument,
    processDocumentUrl,
    isProcessing,
    progress,
    result
  };
}
