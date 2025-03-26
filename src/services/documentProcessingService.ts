
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { DocumentProcessingResult, DocumentLink } from '@/types/document-processing';

// Create a new document processing job
export const createDocumentProcessingJob = async (
  clientId: string,
  agentName: string,
  documentUrl: string,
  documentType: string,
  documentId: string,
  metadata: Record<string, any> = {}
) => {
  try {
    // Insert job record
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        document_url: documentUrl,
        document_type: documentType,
        document_id: documentId,
        status: 'pending',
        metadata: metadata,
      } as any)
      .select()
      .single();
      
    if (error) {
      console.error("Error creating document processing job:", error);
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error in createDocumentProcessingJob:", error);
    throw error;
  }
};

// Process a document URL
export const processDocumentUrl = async (
  clientId: string,
  documentUrl: string,
  documentType: string,
  agentName: string
): Promise<DocumentProcessingResult> => {
  try {
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .insert({
        client_id: clientId,
        document_url: documentUrl,
        document_type: documentType,
        agent_name: agentName,
        status: 'pending'
      } as any)
      .select()
      .single();

    if (error) throw error;
    
    return {
      success: true,
      processed: 0,
      failed: 0,
      jobId: data.id,
      documentId: data.document_id,
      status: 'pending'
    };
  } catch (error) {
    console.error("Error processing document URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processed: 0,
      failed: 0
    };
  }
};

// Upload a document
export const uploadDocument = async (
  clientId: string,
  file: File,
  agentName: string
): Promise<DocumentProcessingResult> => {
  try {
    // Create a unique path for the file
    const filePath = `documents/${clientId}/${Date.now()}_${file.name}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: urlData } = await supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) throw new Error('Failed to get document URL');
    
    // Create a processing job for the uploaded document
    const documentUrl = urlData.publicUrl;
    const documentType = file.type.includes('pdf') ? 'pdf' : 'document';
    
    const result = await processDocumentUrl(clientId, documentUrl, documentType, agentName);
    
    return result;
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processed: 0,
      failed: 0
    };
  }
};

// Get document processing stats
export const getDocumentProcessingStats = async (clientId: string) => {
  try {
    // Default stats object
    let stats = {
      total: 0,
      processed: 0,
      pending: 0,
      failed: 0,
      last_processed: null,
      error_message: null
    };
    
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) {
      console.error("Error fetching document stats:", error);
      return stats;
    }
    
    if (!data || data.length === 0) {
      return stats;
    }
    
    // Calculate stats
    stats.total = data.length;
    stats.processed = data.filter(d => d.status === 'completed').length;
    stats.pending = data.filter(d => d.status === 'pending').length;
    stats.failed = data.filter(d => d.status === 'failed').length;
    
    // Get last processed document
    const sortedData = [...data]
      .filter(d => d.status === 'completed')
      .sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return dateB - dateA;
      });
    
    if (sortedData.length > 0) {
      stats.last_processed = sortedData[0].updated_at;
      
      // Convert processed_count and failed_count from metadata to numbers if they exist
      if (sortedData[0].metadata && typeof sortedData[0].metadata === 'object') {
        const metadata = sortedData[0].metadata as any;
        if (metadata.processed_count !== undefined) {
          stats.processed = Number(metadata.processed_count);
        }
        if (metadata.failed_count !== undefined) {
          stats.failed = Number(metadata.failed_count);
        }
      }
      
      stats.error_message = sortedData[0].error || null;
    }
    
    return stats;
  } catch (error) {
    console.error("Error in getDocumentProcessingStats:", error);
    return {
      total: 0,
      processed: 0,
      pending: 0,
      failed: 0,
      last_processed: null,
      error_message: null
    };
  }
};

// Check the status of a document processing job
export const checkDocumentProcessingStatus = async (jobId: string): Promise<DocumentProcessingResult> => {
  try {
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return {
        success: false,
        error: 'Job not found',
        processed: 0,
        failed: 0
      };
    }
    
    let processed = 0;
    let failed = 0;
    
    if (data.metadata && typeof data.metadata === 'object') {
      const metadata = data.metadata as any;
      processed = metadata.processed_count ? Number(metadata.processed_count) : 0;
      failed = metadata.failed_count ? Number(metadata.failed_count) : 0;
    }
    
    return {
      success: data.status === 'completed',
      error: data.error || data.error_message,
      processed,
      failed,
      status: data.status,
      documentId: data.document_id,
      documentUrl: data.document_url,
      jobId: data.id
    };
  } catch (error) {
    console.error("Error checking document processing status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processed: 0,
      failed: 0
    };
  }
};

// Get all documents for a client
export const getDocumentsForClient = async (clientId: string): Promise<DocumentLink[]> => {
  try {
    const { data, error } = await supabase
      .from('document_links')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as DocumentLink[];
  } catch (error) {
    console.error("Error fetching documents for client:", error);
    return [];
  }
};

// Create a document processing job from document link
export const createDocumentProcessingJobFromLink = async (
  clientId: string,
  agentName: string,
  documentUrl: string,
  documentType: string,
  metadata: Record<string, any> = {}
) => {
  try {
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        document_url: documentUrl,
        document_type: documentType,
        status: 'pending',
        metadata: metadata,
      } as any)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in createDocumentProcessingJobFromLink:", error);
    throw error;
  }
};
