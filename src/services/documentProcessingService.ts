
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingStatus } from '@/types/document-processing';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

// Function to call RPC function safely with error handling
const callRpcFunction = async (
  functionName: string, 
  params: Record<string, any>
): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling RPC function ${functionName}:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in callRpcFunction for ${functionName}:`, error);
    throw error;
  }
};

// Service for document processing functions
export const DocumentProcessingService = {
  // Check the status of a document processing job
  checkStatus: async (documentId: string): Promise<DocumentProcessingStatus> => {
    try {
      const { data, error } = await supabase
        .from('document_processing_status')
        .select('*')
        .eq('job_id', documentId)
        .single();
      
      if (error) {
        console.error('Error checking document processing status:', error);
        throw error;
      }
      
      return data as DocumentProcessingStatus;
    } catch (error) {
      console.error('Error in checkStatus:', error);
      throw error;
    }
  },
  
  // Process a document URL
  processDocument: async (
    clientId: string, 
    documentUrl: string, 
    documentType: string
  ): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          document_url: documentUrl,
          document_type: documentType,
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating document processing job:', error);
        throw error;
      }
      
      return data.id;
    } catch (error) {
      console.error('Error in processDocument:', error);
      throw error;
    }
  }
};

// Function to upload a document and process it
export const uploadDocument = async (
  file: File, 
  clientId: string
): Promise<string> => {
  try {
    // Generate a unique file name
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `clients/${clientId}/documents/${fileName}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('client-documents')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Error uploading document:', uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: urlData } = await supabase
      .storage
      .from('client-documents')
      .getPublicUrl(filePath);
    
    const documentUrl = urlData.publicUrl;
    
    // Determine document type from file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    let documentType = 'text';
    
    if (['pdf'].includes(fileExt)) {
      documentType = 'pdf';
    } else if (['doc', 'docx'].includes(fileExt)) {
      documentType = 'word';
    } else if (['xls', 'xlsx'].includes(fileExt)) {
      documentType = 'excel';
    } else if (['ppt', 'pptx'].includes(fileExt)) {
      documentType = 'powerpoint';
    }
    
    // Create the processing job
    return await DocumentProcessingService.processDocument(
      clientId,
      documentUrl,
      documentType
    );
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    throw error;
  }
};
