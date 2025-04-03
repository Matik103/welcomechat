
import { createDocumentStorageRpcFunctions } from './applyDocumentLinksRLS';
import { ensureDocumentStorageBucket } from './supabaseStorage';

/**
 * Initialize Supabase resources required for the application
 * This should be called once when the app starts
 */
export async function initializeSupabaseResources(): Promise<boolean> {
  try {
    console.log('Initializing Supabase resources...');
    
    // Ensure document storage bucket exists
    const bucketResult = await ensureDocumentStorageBucket();
    console.log('Document storage bucket initialization result:', bucketResult);
    
    // Create RPC functions for document storage
    const rpcResult = await createDocumentStorageRpcFunctions();
    console.log('Document storage RPC functions creation result:', rpcResult.success);
    
    return bucketResult && rpcResult.success;
  } catch (error) {
    console.error('Error initializing Supabase resources:', error);
    return false;
  }
}
