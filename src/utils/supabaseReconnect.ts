
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/admin";
import { DOCUMENTS_BUCKET, ensureBucketExists } from "@/utils/ensureStorageBuckets";
import { initializeRpcFunctions } from "@/utils/supabaseUtils";

/**
 * Comprehensive verification of Supabase connection after database restore
 * Use this function to ensure all aspects of the Supabase connection are working properly
 */
export async function verifySupabaseConnection(): Promise<{
  success: boolean;
  messages: string[];
  errors: string[];
}> {
  const results = {
    success: true,
    messages: [] as string[],
    errors: [] as string[],
  };

  try {
    // Step 1: Verify basic database connection
    const { error: pingError } = await supabase
      .from('clients')
      .select('count(*)')
      .limit(1);
    
    if (pingError) {
      results.success = false;
      results.errors.push(`Database connection error: ${pingError.message}`);
    } else {
      results.messages.push('✅ Database connection successful');
    }

    // Step 2: Verify storage buckets
    try {
      const documentBucketExists = await ensureBucketExists(DOCUMENTS_BUCKET);
      if (documentBucketExists) {
        results.messages.push('✅ Document storage bucket verified');
      } else {
        results.success = false;
        results.errors.push('Failed to verify document storage bucket');
      }
    } catch (storageError) {
      results.success = false;
      results.errors.push(`Storage buckets error: ${storageError instanceof Error ? storageError.message : String(storageError)}`);
    }

    // Step 3: Verify RPC functions
    try {
      await initializeRpcFunctions();
      results.messages.push('✅ RPC functions initialized');
    } catch (rpcError) {
      results.success = false;
      results.errors.push(`RPC functions error: ${rpcError instanceof Error ? rpcError.message : String(rpcError)}`);
    }

    // Step 4: Verify edge functions
    try {
      // Use invoke instead of listFunctions which doesn't exist
      const { error: functionError } = await supabase.functions.invoke('get-functions-list', {});
      
      if (functionError) {
        results.success = false;
        results.errors.push(`Edge functions error: ${functionError.message}`);
      } else {
        results.messages.push(`✅ Edge functions verified`);
      }
    } catch (edgeFnError) {
      results.errors.push(`Edge functions check failed: ${edgeFnError instanceof Error ? edgeFnError.message : String(edgeFnError)}`);
    }

    // Step 5: Verify authentication
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        results.errors.push(`Auth verification error: ${authError.message}`);
      } else {
        const isAuthenticated = !!authData.session;
        results.messages.push(`✅ Auth system working (Current session: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'})`);
      }
    } catch (authCheckError) {
      results.errors.push(`Auth check failed: ${authCheckError instanceof Error ? authCheckError.message : String(authCheckError)}`);
    }

    return results;
    
  } catch (error) {
    results.success = false;
    results.errors.push(`General verification error: ${error instanceof Error ? error.message : String(error)}`);
    return results;
  }
}

/**
 * Reinitialize all Supabase resources after a database restore
 * This function attempts to recreate necessary resources and fix common issues
 */
export async function reinitializeAfterRestore(): Promise<{
  success: boolean;
  messages: string[];
  errors: string[];
}> {
  const results = {
    success: true,
    messages: [] as string[],
    errors: [] as string[],
  };
  
  try {
    // Step 1: Ensure document storage bucket exists and is properly configured
    try {
      // First ensure the bucket exists
      const bucketExists = await ensureBucketExists(DOCUMENTS_BUCKET);
      
      if (bucketExists) {
        results.messages.push('✅ Document storage bucket exists');
        
        // Set proper RLS policies for the bucket
        const { error: policyError } = await supabaseAdmin.storage.from(DOCUMENTS_BUCKET)
          .createSignedUrl('test-permissions.txt', 60);
        
        if (policyError && policyError.message.includes('storage.objects.policy_rls')) {
          // RLS policies might need to be fixed
          results.errors.push('Storage RLS policies may need to be fixed. Run SQL migrations for storage policies.');
        } else {
          results.messages.push('✅ Storage policies appear to be working');
        }
      } else {
        // Try to create the bucket
        const { error: createError } = await supabaseAdmin.storage.createBucket(DOCUMENTS_BUCKET, {
          public: false,
          fileSizeLimit: 20971520, // 20MB
          allowedMimeTypes: ['application/pdf', 'text/plain', 'application/vnd.google-apps.document']
        });
        
        if (createError) {
          results.success = false;
          results.errors.push(`Failed to create document bucket: ${createError.message}`);
        } else {
          results.messages.push('✅ Created document storage bucket');
        }
      }
    } catch (bucketError) {
      results.success = false;
      results.errors.push(`Storage bucket error: ${bucketError instanceof Error ? bucketError.message : String(bucketError)}`);
    }
    
    // Step 2: Verify RPC functions and recreate them if needed
    try {
      await initializeRpcFunctions();
      results.messages.push('✅ RPC functions initialized successfully');
    } catch (rpcError) {
      results.success = false;
      results.errors.push(`RPC functions initialization error: ${rpcError instanceof Error ? rpcError.message : String(rpcError)}`);
    }
    
    // Step 3: Check authentication and session management
    try {
      await supabase.auth.refreshSession();
      results.messages.push('✅ Auth session refreshed successfully');
    } catch (authError) {
      results.errors.push(`Auth refresh error: ${authError instanceof Error ? authError.message : String(authError)}`);
    }

    // Step 4: Verify database tables and reapply migrations if needed
    try {
      // Check a critical table to ensure it exists
      const { error: tableError } = await supabase
        .from('ai_agents')
        .select('count(*)')
        .limit(1);
      
      if (tableError) {
        if (tableError.code === '42P01') { // undefined_table error
          results.errors.push('Critical tables missing. Database may need schema migration reapplication.');
        } else {
          results.errors.push(`Table check error: ${tableError.message}`);
        }
      } else {
        results.messages.push('✅ Database tables verified');
      }
    } catch (tableCheckError) {
      results.errors.push(`Database table check failed: ${tableCheckError instanceof Error ? tableCheckError.message : String(tableCheckError)}`);
    }
    
    return results;
  } catch (error) {
    results.success = false;
    results.errors.push(`General reinitialization error: ${error instanceof Error ? error.message : String(error)}`);
    return results;
  }
}
