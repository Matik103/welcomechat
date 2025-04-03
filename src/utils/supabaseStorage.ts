
// Storage bucket constants
export const DOCUMENTS_BUCKET = 'document-storage';
export const PROFILE_IMAGES_BUCKET = 'avatars';
export const WIDGET_LOGOS_BUCKET = 'widget-logos';

import { supabase } from '@/integrations/supabase/client';
import { callRpcFunctionSafe } from './rpcUtils';

/**
 * Ensures that the document-storage bucket exists
 * Creates it if it doesn't exist
 * @returns Promise<boolean> - true if bucket exists or was created successfully
 */
export const ensureDocumentStorageBucket = async (): Promise<boolean> => {
  try {
    console.log('Checking if document-storage bucket exists...');
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Check if the bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === DOCUMENTS_BUCKET);
    
    if (!bucketExists) {
      console.log(`Creating ${DOCUMENTS_BUCKET} bucket...`);
      const { data, error } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
        public: true,
        allowedMimeTypes: [
          'application/pdf', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv'
        ],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error(`Error creating ${DOCUMENTS_BUCKET} bucket:`, error);
        return false;
      }
      
      console.log(`Created ${DOCUMENTS_BUCKET} bucket successfully:`, data);
      return true;
    } else {
      console.log(`${DOCUMENTS_BUCKET} bucket already exists`);
      return true;
    }
  } catch (error) {
    console.error(`Error ensuring ${DOCUMENTS_BUCKET} bucket exists:`, error);
    return false;
  }
};

/**
 * Safely access document-storage records
 * This helps avoid issues with hyphenated table names which can cause 
 * TypeScript type errors with Supabase client
 */
export const getDocumentStorage = async (clientId: string, storagePath?: string) => {
  try {
    if (storagePath) {
      // Query for a specific document
      const { data, error } = await callRpcFunctionSafe(
        'get_document_by_path',
        {
          p_client_id: clientId,
          p_storage_path: storagePath
        }
      );
      
      if (error) throw error;
      return data;
    } else {
      // Query for all client documents
      const { data, error } = await callRpcFunctionSafe(
        'get_client_documents',
        {
          p_client_id: clientId
        }
      );
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error accessing document-storage:', error);
    return null;
  }
};
