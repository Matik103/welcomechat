
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { 
  downloadFileFromUrl, 
  convertToPdfIfNeeded,
  isGoogleDriveUrl,
  getGoogleDriveDownloadUrl
} from '@/utils/documentConverter';
import { 
  uploadDocumentToLlamaIndex, 
  processLlamaIndexJob 
} from '@/services/llamaIndexService';

export function useDocumentUrlProcessing(clientId: string) {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Process a document URL (Google Drive, Google Docs, etc.)
   * @param url The URL to process
   * @returns Promise resolving when processing is complete
   */
  const processDocumentUrl = async (url: string): Promise<void> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    setIsProcessing(true);
    
    try {
      // 1. Get the agent name for this client
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('name')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .limit(1)
        .maybeSingle();
      
      if (agentError) {
        console.error('Failed to get agent name:', agentError);
        throw new Error(`Failed to get agent name: ${agentError.message}`);
      }
      
      if (!agentData || !agentData.name) {
        throw new Error('Agent name not found for this client');
      }
      
      const agentName = agentData.name;
      console.log("Using agent name for document URL processing:", agentName);

      // 2. Check if it's a Google Drive URL and get the direct download URL
      let downloadUrl = url;
      let documentType = 'url';
      
      if (isGoogleDriveUrl(url)) {
        downloadUrl = getGoogleDriveDownloadUrl(url);
        documentType = 'google_drive';
        console.log(`Converted Google URL to download URL: ${downloadUrl}`);
      }

      // 3. Download the file
      console.log("Downloading file from URL:", downloadUrl);
      const downloadedFile = await downloadFileFromUrl(downloadUrl);
      console.log("File downloaded successfully:", downloadedFile.name, downloadedFile.type);

      // 4. Convert to PDF if needed
      console.log("Converting document to PDF if needed:", downloadedFile.name);
      const pdfFile = await convertToPdfIfNeeded(downloadedFile);
      
      // 5. Process the document with LlamaIndex
      console.log("Uploading document to LlamaIndex for processing:", pdfFile.name);
      const jobId = await uploadDocumentToLlamaIndex(pdfFile);
      console.log("LlamaIndex job created:", jobId);
      
      // 6. Create a document processing job record
      const documentId = uuidv4();
      const { error: jobError } = await supabase
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          agent_name: agentName,
          document_url: url,
          document_type: documentType,
          document_id: documentId,
          status: 'processing',
          metadata: {
            file_name: downloadedFile.name,
            file_size: downloadedFile.size,
            source_url: url,
            llama_job_id: jobId
          }
        });
      
      if (jobError) {
        console.error('Error creating document processing job:', jobError);
        throw new Error(`Failed to create document record: ${jobError.message}`);
      }
      
      // 7. Create a document link record
      const { error: linkError } = await supabase
        .from('document_links')
        .insert({
          client_id: clientId,
          document_type: documentType,
          link: url,
          file_name: downloadedFile.name,
          file_size: downloadedFile.size,
          file_type: downloadedFile.type
        });
      
      if (linkError) {
        console.error('Error creating document link record:', linkError);
        throw new Error(`Failed to create document record: ${linkError.message}`);
      }
      
      // 8. Wait for LlamaIndex job to complete and get the results
      console.log("Waiting for LlamaIndex job to complete...");
      const extractedText = await processLlamaIndexJob(jobId);
      console.log("LlamaIndex processing complete, text length:", extractedText.length);
      
      // 9. Update the document processing job with the extracted text
      const { error: updateJobError } = await supabase
        .from('document_processing_jobs')
        .update({
          status: 'completed',
          content: extractedText,
          metadata: {
            file_name: downloadedFile.name,
            file_size: downloadedFile.size,
            source_url: url,
            llama_job_id: jobId,
            processing_completed: new Date().toISOString()
          }
        })
        .eq('document_id', documentId);
      
      if (updateJobError) {
        console.error('Error updating document processing job:', updateJobError);
        throw new Error(`Failed to update document record: ${updateJobError.message}`);
      }
      
      // 10. Update the AI agent content with the extracted text
      const { data: agentContent, error: contentError } = await supabase
        .from('ai_agents')
        .select('content')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .limit(1)
        .single();
      
      if (contentError) {
        console.error('Error fetching agent content:', contentError);
        throw new Error(`Failed to fetch agent content: ${contentError.message}`);
      }
      
      // Append the new document content
      const existingContent = agentContent.content || '';
      const updatedContent = `${existingContent}\n\n--- Document: ${downloadedFile.name} (from URL: ${url}) ---\n${extractedText}`;
      
      const { error: updateAgentError } = await supabase
        .from('ai_agents')
        .update({ content: updatedContent })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
      
      if (updateAgentError) {
        console.error('Error updating agent content:', updateAgentError);
        throw new Error(`Failed to update agent content: ${updateAgentError.message}`);
      }
      
      toast.success(`Document URL processed successfully: ${url}`);
    } catch (error) {
      console.error('Error processing document URL:', error);
      toast.error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processDocumentUrl,
    isProcessing
  };
}
