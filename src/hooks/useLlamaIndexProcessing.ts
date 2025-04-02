import { useState } from 'react';
import { DocumentProcessingService } from '@/utils/DocumentProcessingService';
import { DocumentProcessingResult } from '@/types/document-processing';
import { toast } from 'sonner';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env'; // Import OpenAI API key

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
      console.log(`Starting LlamaIndex processing for ${file.name} (${file.type}, ${file.size} bytes)`);
      
      // Log if we have API keys configured
      if (LLAMA_CLOUD_API_KEY) {
        console.log('LlamaIndex API key is configured via environment variables');
      } else {
        console.warn('No LlamaIndex API key found in environment variables - will try to fetch from Supabase secrets');
      }

      if (OPENAI_API_KEY) {
        console.log('OpenAI API key is configured via environment variables');
      } else {
        console.warn('No OpenAI API key found in environment variables - will try to fetch from Supabase secrets');
      }
      
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
      
      try {
        // Process document with LlamaIndex
        console.log("Calling DocumentProcessingService.processDocument...");
        const result = await DocumentProcessingService.processDocument(file, clientId);
        console.log("Document processing completed with result:", result);
        
        // Clear the interval and set final progress
        clearInterval(progressInterval);
        setProgress(100);
        
        if (result.success) {
          console.log("Document processing successful!");
          if (result.extractedText) {
            console.log(`Extracted text length: ${result.extractedText.length} characters`);
            console.log(`First 100 chars of extracted text: ${result.extractedText.substring(0, 100)}...`);
          } else {
            console.warn("Document processed successfully but no extracted text was returned");
          }
          
          setResult(result);
          toast.success('Document processed successfully');
        } else {
          setResult(result);
          console.error("Document processing failed:", result.error);
          toast.error(result.error || 'Failed to process document');
        }
        
        return result;
      } catch (fetchError) {
        console.error('Error in DocumentProcessingService.processDocument:', fetchError);
        // Make sure we clear the interval in case of error
        clearInterval(progressInterval);
        
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        
        const failResult: DocumentProcessingResult = {
          success: false,
          error: `Error processing document: ${errorMessage}`,
          processed: 0,
          failed: 1,
          documentId: undefined
        };
        
        setResult(failResult);
        setProgress(100); // Set to 100 to indicate processing is complete, even if failed
        toast.error(`Error processing document: ${errorMessage}`);
        
        return failResult;
      }
    } catch (error) {
      console.error('Error processing document with LlamaIndex:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const failResult: DocumentProcessingResult = {
        success: false,
        error: errorMessage,
        processed: 0,
        failed: 1,
        documentId: undefined
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
      console.log(`Starting LlamaIndex processing for URL: ${url}`);
      
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
      
      console.log("LlamaIndex URL processing completed with result:", result);
      
      if (result.success) {
        setResult(result);
        toast.success('Document URL processed successfully');
      } else {
        setResult(result);
        console.error("Document URL processing failed:", result.error);
        toast.error(result.error || 'Failed to process document URL');
      }
      
      return result;
    } catch (error) {
      console.error('Error processing document URL with LlamaIndex:', error);
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
