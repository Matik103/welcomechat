
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
    
    // Setup RLS policies for the bucket
    const { error: policyError } = await supabase.rpc('setup_document_storage_policies');
    
    if (policyError) {
      console.error('Error setting up storage policies:', policyError);
      // Continue anyway, as the bucket was created
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring document storage bucket exists:', error);
    return false;
  }
};
