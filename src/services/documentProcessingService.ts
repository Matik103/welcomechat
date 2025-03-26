
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

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
    // Type assertion to any to bypass type checking temporarily
    const { data, error } = await (supabase as any)
      .from('document_processing')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        document_url: documentUrl,
        document_type: documentType,
        status: 'pending',
        started_at: new Date().toISOString(),
        metadata: metadata,
        // Remove document_id as it's not in the table schema
      })
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
    
    // Type assertion to any to bypass type checking temporarily
    const { data, error } = await (supabase as any)
      .from('document_processing')
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
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    
    if (sortedData.length > 0) {
      stats.last_processed = sortedData[0].completed_at;
      
      // Convert processed_count and failed_count from metadat to numbers if they exist
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

// Get document processing jobs for a client
export const getDocumentProcessingJobs = async (clientId: string) => {
  try {
    // Type assertion to any to bypass type checking temporarily
    const { data, error } = await (supabase as any)
      .from('document_processing')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error in getDocumentProcessingJobs:", error);
    return [];
  }
};

// Update document processing job status
export const updateDocumentProcessingJobStatus = async (
  jobId: number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string,
  metadata?: Record<string, any>
) => {
  try {
    const updates: Record<string, any> = { status };
    
    if (error) {
      updates.error = error;
    }
    
    if (metadata) {
      updates.metadata = metadata;
    }
    
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    // Type assertion to any to bypass type checking temporarily
    const { data, error: updateError } = await (supabase as any)
      .from('document_processing')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    return data;
  } catch (error) {
    console.error("Error in updateDocumentProcessingJobStatus:", error);
    throw error;
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
    // Type assertion to any to bypass type checking temporarily
    const { data, error } = await (supabase as any)
      .from('document_processing')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        document_url: documentUrl,
        document_type: documentType,
        status: 'pending',
        started_at: new Date().toISOString(),
        metadata: metadata,
        // Remove document_id as it's not in the table schema
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in createDocumentProcessingJobFromLink:", error);
    throw error;
  }
};
