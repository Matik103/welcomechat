
import { createClient } from '@supabase/supabase-js';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DocumentMetadata {
  contentType?: string;
  size?: number;
  lastModified?: number;
  [key: string]: any;
}

interface DocumentUploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  publicUrl?: string;
}

/**
 * Upload a document to the document storage system
 */
export const uploadDocument = async (
  file: File,
  clientId: string,
  metadata: DocumentMetadata = {}
): Promise<DocumentUploadResult> => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No authenticated user');

    // Generate a unique file path
    const uniqueId = crypto.randomUUID();
    const filePath = `${clientId}/${uniqueId}-${file.name}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return {
        success: false,
        error: uploadError.message
      };
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(filePath);
      
    // Store document metadata in the database
    const { data: docData, error: docError } = await supabase
      .from('document_storage')
      .insert({
        client_id: clientId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        public_url: publicUrl,
        created_by: user.id,
        metadata: {
          ...metadata,
          contentType: file.type,
          size: file.size,
          lastModified: file.lastModified
        }
      })
      .select()
      .single();
      
    if (docError) {
      console.error('Error storing document metadata:', docError);
      return {
        success: false,
        error: docError.message
      };
    }
    
    return {
      success: true,
      documentId: docData.id,
      publicUrl: docData.public_url
    };
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Get documents for a client
 */
export const getClientDocuments = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_client_documents', { p_client_id: clientId });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting client documents:', error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId: string) => {
  try {
    // Get document info first
    const { data: doc, error: getError } = await supabase
      .from('document_storage')
      .select('file_path')
      .eq('id', documentId)
      .single();
      
    if (getError) throw getError;
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([doc.file_path]);
      
    if (storageError) throw storageError;
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('document_storage')
      .delete()
      .eq('id', documentId);
      
    if (dbError) throw dbError;
    
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};
