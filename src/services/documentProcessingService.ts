import { supabaseAdmin } from "@/integrations/supabase/client-admin";
import { safeString, safeNumber } from "@/utils/typeUtils";

export interface Document {
  id: number;
  client_id: string;
  url: string;
  filename: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_processed_at?: string;
  refresh_rate: number;
  document_type: string;
  error?: string | null;
  token_count?: number;
  metadata?: any;
}

/**
 * Get all documents for a client
 */
export const getDocuments = async (clientId: string): Promise<Document[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    
    return (data || []).map(doc => ({
      id: doc.id,
      client_id: safeString(doc.client_id),
      url: safeString(doc.url),
      filename: safeString(doc.filename),
      description: safeString(doc.description),
      status: safeString(doc.status),
      created_at: safeString(doc.created_at),
      updated_at: safeString(doc.updated_at),
      last_processed_at: safeString(doc.last_processed_at),
      refresh_rate: safeNumber(doc.refresh_rate),
      document_type: safeString(doc.document_type),
      error: doc.error,
      token_count: safeNumber(doc.token_count),
      metadata: doc.metadata
    }));
  } catch (error) {
    console.error('Error in getDocuments:', error);
    return [];
  }
};

/**
 * Get a single document by ID
 */
export const getDocumentById = async (documentId: number): Promise<Document | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      client_id: safeString(data.client_id),
      url: safeString(data.url),
      filename: safeString(data.filename),
      description: safeString(data.description),
      status: safeString(data.status),
      created_at: safeString(data.created_at),
      updated_at: safeString(data.updated_at),
      last_processed_at: safeString(data.last_processed_at),
      refresh_rate: safeNumber(data.refresh_rate),
      document_type: safeString(data.document_type),
      error: data.error,
      token_count: safeNumber(data.token_count),
      metadata: data.metadata
    };
  } catch (error) {
    console.error('Error in getDocumentById:', error);
    return null;
  }
};

/**
 * Add a new document
 */
export const addDocument = async (
  clientId: string,
  url: string,
  filename: string,
  description: string | null,
  refreshRate: number,
  documentType: string
): Promise<Document | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert([
        {
          client_id: clientId,
          url: url,
          filename: filename,
          description: description,
          status: 'pending',
          refresh_rate: refreshRate,
          document_type: documentType
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding document:', error);
      return null;
    }
    
    return {
      id: data.id,
      client_id: safeString(data.client_id),
      url: safeString(data.url),
      filename: safeString(data.filename),
      description: safeString(data.description),
      status: safeString(data.status),
      created_at: safeString(data.created_at),
      updated_at: safeString(data.updated_at),
      last_processed_at: safeString(data.last_processed_at),
      refresh_rate: safeNumber(data.refresh_rate),
      document_type: safeString(data.document_type),
      error: data.error,
      token_count: safeNumber(data.token_count),
      metadata: data.metadata
    };
  } catch (error) {
    console.error('Error in addDocument:', error);
    return null;
  }
};

/**
 * Update an existing document
 */
export const updateDocument = async (
  documentId: number,
  updates: Partial<Document>
): Promise<Document | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating document:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      client_id: safeString(data.client_id),
      url: safeString(data.url),
      filename: safeString(data.filename),
      description: safeString(data.description),
      status: safeString(data.status),
      created_at: safeString(data.created_at),
      updated_at: safeString(data.updated_at),
      last_processed_at: safeString(data.last_processed_at),
      refresh_rate: safeNumber(data.refresh_rate),
      document_type: safeString(data.document_type),
      error: data.error,
      token_count: safeNumber(data.token_count),
      metadata: data.metadata
    };
  } catch (error) {
    console.error('Error in updateDocument:', error);
    return null;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId: number): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    return false;
  }
};

/**
 * Update document status
 */
export const updateDocumentStatus = async (documentId: number, status: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
      .from('documents')
      .update({ status })
      .eq('id', documentId);
    
    if (error) {
      console.error('Error updating document status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateDocumentStatus:', error);
    return false;
  }
};

/**
 * Log document processing activity
 */
export const logDocumentProcessingActivity = async (
  documentId: number,
  activityType: string,
  activityData: any
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
      .from('document_processing_activities')
      .insert([
        {
          document_id: documentId,
          activity_type: activityType,
          activity_data: activityData
        }
      ]);
    
    if (error) {
      console.error('Error logging document processing activity:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in logDocumentProcessingActivity:', error);
    return false;
  }
};

/**
 * Create a document from a Google Drive file
 */
export const createDocumentFromGoogleDriveFile = async (
  clientId: string,
  fileId: string,
  documentData: any
): Promise<Document | null> => {
  try {
    // Extract relevant information from documentData
    const url = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    
    // Use defined or empty string instead of null
    const filename = documentData.filename || '';
    
    // Use as-is instead of forcing to null 
    const error = documentData.error;
    
    // Use undefined instead of null for compatibility
    const description = documentData.description || undefined;
    
    const refreshRate = 60; // Default refresh rate
    const documentType = 'google_drive';
    
    // Insert the document into the database
    const { data, error: insertError } = await supabaseAdmin
      .from('documents')
      .insert([
        {
          client_id: clientId,
          url: url,
          filename: filename,
          description: description,
          status: 'pending',
          refresh_rate: refreshRate,
          document_type: documentType,
          error: error
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating document from Google Drive file:', insertError);
      return null;
    }
    
    // Return the created document
    return {
      id: data.id,
      client_id: safeString(data.client_id),
      url: safeString(data.url),
      filename: safeString(data.filename),
      description: safeString(data.description),
      status: safeString(data.status),
      created_at: safeString(data.created_at),
      updated_at: safeString(data.updated_at),
      last_processed_at: safeString(data.last_processed_at),
      refresh_rate: safeNumber(data.refresh_rate),
      document_type: safeString(data.document_type),
      error: data.error,
      token_count: safeNumber(data.token_count),
      metadata: data.metadata
    };
  } catch (error) {
    console.error('Error in createDocumentFromGoogleDriveFile:', error);
    return null;
  }
};
