import { createDocumentStorageRpcFunctions } from './applyDocumentLinksRLS';
import { getDocumentStorageBucket, setupStoragePolicies } from './supabaseStorage';

/**
 * Initialize Supabase resources required for the application
 * This should be called once when the app starts
 */
export async function initializeSupabaseResources(): Promise<boolean> {
  try {
    console.log('Initializing Supabase resources...');
    
    // Verify and create document storage bucket if needed
    try {
      await getDocumentStorageBucket();
      console.log('Client documents bucket is ready');
      
      // Ensure storage policies are set up
      await setupStoragePolicies();
      console.log('Storage policies are configured');
    } catch (storageError) {
      console.error('Error setting up document storage:', storageError);
      return false;
    }
    
    // Create RPC functions for document storage
    const rpcResult = await createDocumentStorageRpcFunctions();
    console.log('Client documents RPC functions creation result:', rpcResult.success);
    
    return rpcResult.success;
  } catch (error) {
    console.error('Error initializing Supabase resources:', error);
    return false;
  }
}
