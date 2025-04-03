
// Define bucket names as constants
export const DOCUMENTS_BUCKET = 'document-storage';

/**
 * Ensures the document storage bucket exists and has proper permissions
 */
export const ensureDocumentStorageBucket = async (): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Try to create the bucket if it doesn't exist
    const { error } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
      public: true,
      allowedMimeTypes: ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      fileSizeLimit: 20971520 // 20MB
    });
    
    if (error && !error.message.includes('already exists')) {
      console.error(`Error creating ${DOCUMENTS_BUCKET} bucket:`, error);
      return false;
    }
    
    console.log(`Bucket ${DOCUMENTS_BUCKET} ready for upload`);
    
    // Create or run the RPC function to setup storage policies
    try {
      const { data, error: rpcError } = await supabase
        .rpc('setup_document_storage_policies');
      
      if (rpcError) {
        console.error('Error setting up storage policies:', rpcError);
        // Continue anyway, as the bucket was created
      } else {
        console.log('Storage policies setup successful:', data);
      }
    } catch (rpcError) {
      console.error('Error calling setup_document_storage_policies RPC:', rpcError);
      // Continue since the bucket itself might be operational
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring document storage bucket exists:', error);
    return false;
  }
};
