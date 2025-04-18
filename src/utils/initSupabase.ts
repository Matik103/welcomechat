import { createDocumentStorageRpcFunctions } from './applyDocumentLinksRLS';
import { getDocumentStorageBucket } from './supabaseStorage';

/**
 * Initialize Supabase resources required for the application
 * This should be called once when the app starts
 */
export async function initializeSupabaseResources(): Promise<boolean> {
  try {
    console.log('Initializing Supabase resources...');
    
    // Verify document storage bucket is accessible
    try {
      await getDocumentStorageBucket();
      console.log('Client documents bucket is accessible');
    } catch (storageError) {
      console.error('Error accessing client documents bucket:', storageError);
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
