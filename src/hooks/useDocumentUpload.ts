import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { 
  DocumentProcessingStatus, 
  DocumentProcessingResult, 
  LlamaIndexJobResponse, 
  LlamaIndexParsingResult 
} from '@/types/document-processing';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { v4 as uuidv4 } from 'uuid';
import { convertToPdfIfNeeded } from '@/utils/documentConverter';
import { 
  uploadDocumentToLlamaIndex, 
  processLlamaIndexJob 
} from '@/services/llamaIndexService';

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload a document to Supabase storage and process with LlamaIndex
   * @param file The file to upload
   * @returns Promise resolving when the upload is complete
   */
  const uploadDocument = async (file: File): Promise<void> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    setIsUploading(true);
    
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
      console.log("Using agent name for document upload:", agentName);

      // 2. Convert the file to PDF if needed
      console.log("Converting document to PDF if needed:", file.name);
      const pdfFile = await convertToPdfIfNeeded(file);
      
      // 3. Upload the file to storage
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${clientId}/${fileName}`;
      
      // Upload the original file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);
      
      console.log(`File uploaded successfully. Public URL: ${publicUrl}`);
      
      // 4. Process the document with LlamaIndex
      console.log("Uploading document to LlamaIndex for processing:", pdfFile.name);
      const jobId = await uploadDocumentToLlamaIndex(pdfFile);
      console.log("LlamaIndex job created:", jobId);
      
      // 5. Create a document processing job record
      const documentId = uuidv4();
      const { error: jobError } = await supabase
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          agent_name: agentName,
          document_url: publicUrl,
          document_type: file.type.includes('pdf') ? 'pdf' : 'document',
          document_id: documentId,
          status: 'processing',
          metadata: {
            file_name: fileName,
            file_size: file.size,
            storage_path: filePath,
            llama_job_id: JSON.stringify(jobId)
          }
        });
      
      if (jobError) {
        console.error('Error creating document processing job:', jobError);
        throw new Error(`Failed to create document record: ${jobError.message}`);
      }
      
      // 6. Create a document link record
      const { error: linkError } = await supabase
        .from('document_links')
        .insert({
          client_id: clientId,
          document_type: file.type.includes('pdf') ? 'pdf' : 'document',
          link: publicUrl,
          storage_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        });
      
      if (linkError) {
        console.error('Error creating document link record:', linkError);
        throw new Error(`Failed to create document record: ${linkError.message}`);
      }
      
      // 7. Wait for LlamaIndex job to complete and get the results
      console.log("Waiting for LlamaIndex job to complete...");
      const extractedText = await processLlamaIndexJob(jobId);
      console.log("LlamaIndex processing complete, text length:", extractedText.length);
      
      // 8. Update the document processing job with the extracted text
      const { error: updateJobError } = await supabase
        .from('document_processing_jobs')
        .update({
          status: 'completed',
          content: extractedText,
          metadata: {
            file_name: fileName,
            file_size: file.size,
            storage_path: filePath,
            llama_job_id: JSON.stringify(jobId),
            processing_completed: new Date().toISOString()
          }
        })
        .eq('document_id', documentId);
      
      if (updateJobError) {
        console.error('Error updating document processing job:', updateJobError);
        throw new Error(`Failed to update document record: ${updateJobError.message}`);
      }
      
      // 9. Update the AI agent content with the extracted text
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
      const updatedContent = `${existingContent}\n\n--- Document: ${file.name} ---\n${extractedText}`;
      
      const { error: updateAgentError } = await supabase
        .from('ai_agents')
        .update({ content: updatedContent })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
      
      if (updateAgentError) {
        console.error('Error updating agent content:', updateAgentError);
        throw new Error(`Failed to update agent content: ${updateAgentError.message}`);
      }
      
      toast.success(`Document "${file.name}" uploaded and processed successfully`);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading
  };
}
