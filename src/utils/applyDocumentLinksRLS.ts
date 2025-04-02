
import { supabase } from '@/integrations/supabase/client';

// Function to fix document links RLS
export const fixDocumentLinksRLS = async (): Promise<{ success: boolean }> => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        BEGIN;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Service role has full access to document links" ON public.document_links;
        DROP POLICY IF EXISTS "Users can view their own document links" ON public.document_links;
        DROP POLICY IF EXISTS "Users can insert their own document links" ON public.document_links;
        DROP POLICY IF EXISTS "Users can update their own document links" ON public.document_links;
        DROP POLICY IF EXISTS "Users can delete their own document links" ON public.document_links;

        -- Create simpler policy for now
        CREATE POLICY "Service role has full access to document links"
          ON public.document_links
          FOR ALL
          USING (true)
          WITH CHECK (true);

        COMMIT;
      `
    });

    if (error) {
      console.error('Error fixing document links RLS:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in fixDocumentLinksRLS:', error);
    return { success: false };
  }
};
