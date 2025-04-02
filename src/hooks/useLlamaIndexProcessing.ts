
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult } from '@/types/document-processing';
import { v4 as uuidv4 } from 'uuid';

export function useLlamaIndexProcessing(clientId: string) {
  const [progress, setProgress] = useState(0);

  const processDocument = async (file: File, agentName?: string): Promise<DocumentProcessingResult> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    try {
      setProgress(10);
      
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Generate a unique document ID
      const documentId = uuidv4();
      
      setProgress(20);
      
      // Call the LlamaIndex proxy endpoint
      console.log('Calling LlamaIndex proxy endpoint for document processing');
      const response = await supabase.functions.invoke('llamaindex-proxy', {
        body: {
          file_name: file.name,
          file_type: file.type,
          clientId: clientId,
          agentName: agentName,
          documentId: documentId,
          data: await file.arrayBuffer()
        }
      });
      
      setProgress(90);
      
      if (response.error) {
        console.error('Error from LlamaIndex proxy:', response.error);
        throw new Error(response.error.message || 'Error processing document');
      }
      
      // Extract the document content from the response
      const data = response.data;
      
      if (!data) {
        throw new Error('No data returned from LlamaIndex proxy');
      }
      
      // Clean up the extracted text if needed
      let extractedText = '';
      if (data.text) {
        extractedText = data.text;
      } else if (data.nodes && Array.isArray(data.nodes)) {
        // Concatenate text from all nodes
        extractedText = data.nodes.map((node: any) => node.text).join('\n\n');
      }
      
      setProgress(100);
      
      return {
        success: true,
        documentId,
        processed: data.nodes?.length || 1,
        failed: 0,
        extractedText
      };
    } catch (error) {
      console.error('Error in processDocument:', error);
      
      // Set progress to 100 to indicate completion (even with error)
      setProgress(100);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: 0,
        failed: 1,
        documentId: uuidv4() // Generate a new ID even for failed attempts for tracking
      };
    }
  };

  return {
    processDocument,
    progress
  };
}
