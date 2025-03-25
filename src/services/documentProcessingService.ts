
import { supabase } from "@/integrations/supabase/client";
import { execSql } from "@/utils/rpcUtils";

interface DocumentProcessingJob {
  id: number;
  document_url: string;
  client_id: string;
  agent_name: string;
  document_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  error?: string;
  metadata: any;
  chunks: any;
  created_at: string;
  updated_at: string;
}

export const getPendingDocuments = async (): Promise<DocumentProcessingJob[]> => {
  try {
    // Use execSql without type arguments
    const result = await execSql(
      `
      SELECT *
      FROM document_processing_jobs 
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 10
      `
    );
    
    if (!result || !Array.isArray(result)) {
      console.warn("No pending documents found or invalid result format.");
      return [];
    }

    return result as DocumentProcessingJob[];
  } catch (error) {
    console.error("Error fetching pending documents:", error);
    return [];
  }
};
