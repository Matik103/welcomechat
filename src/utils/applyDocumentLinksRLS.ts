
import { supabase } from '@/integrations/supabase/client';

// Function to fix document links RLS
export const fixDocumentLinksRLS = async (): Promise<{ success: boolean }> => {
  try {
    // First fix the document_links table RLS
    const { data: linkData, error: linkError } = await supabase.rpc('exec_sql', {
      sql_query: `
        BEGIN;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own document links" ON public.document_links;
        DROP POLICY IF EXISTS "Users can insert their own document links" ON public.document_links;
        DROP POLICY IF EXISTS "Users can update their own document links" ON public.document_links;
        DROP POLICY IF EXISTS "Users can delete their own document links" ON public.document_links;
        DROP POLICY IF EXISTS "Service role has full access to document links" ON public.document_links;
        DROP POLICY IF EXISTS "authenticated_can_do_anything" ON public.document_links;

        -- Create simple permissive policy for development
        CREATE POLICY "authenticated_can_do_anything" 
          ON document_links
          FOR ALL 
          TO authenticated
          USING (true)
          WITH CHECK (true);

        -- Also add service role policy
        CREATE POLICY "Service role has full access to document links"
          ON document_links
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);

        COMMIT;
      `
    });

    if (linkError) {
      console.error('Error fixing document links RLS:', linkError);
    }

    // Now fix the storage bucket RLS policies
    const { data: storageData, error: storageError } = await supabase.rpc('exec_sql', {
      sql_query: `
        BEGIN;
        
        -- Drop existing storage policies
        DROP POLICY IF EXISTS "Enable storage access for authenticated users" ON storage.objects;
        DROP POLICY IF EXISTS "Public Access to document-storage" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated users can upload to document-storage" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete their own uploads in document-storage" ON storage.objects;
        
        -- Create permissive policies for development
        CREATE POLICY "Enable storage access for all users"
          ON storage.objects FOR ALL
          USING (bucket_id = 'document-storage')
          WITH CHECK (bucket_id = 'document-storage');
        
        -- Ensure RLS is enabled
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        
        COMMIT;
      `
    });

    if (storageError) {
      console.error('Error fixing storage RLS:', storageError);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in fixDocumentLinksRLS:', error);
    return { success: false };
  }
};

// Function to ensure the document-storage bucket exists
export const ensureDocumentStorageBucket = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        BEGIN;
        
        -- Create the document-storage bucket if it doesn't exist
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('document-storage', 'document-storage', true)
        ON CONFLICT (id) DO NOTHING;
        
        COMMIT;
      `
    });

    if (error) {
      console.error('Error ensuring document-storage bucket exists:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in ensureDocumentStorageBucket:', error);
    return false;
  }
};
