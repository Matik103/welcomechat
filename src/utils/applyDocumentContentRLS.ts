
import { supabase } from '@/integrations/supabase/client';

/**
 * Apply document content RLS policies to fix permissions issues
 */
export const fixDocumentContentRLS = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          -- Fix RLS policies for document_content table
          ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;
          
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Enable document_content access for authenticated users" ON document_content;
          
          -- Create policies that allow authenticated users to access all document_content records
          CREATE POLICY "Enable document_content access for authenticated users"
          ON document_content FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
        `
      });

    if (error) {
      console.error('Error applying document content RLS policies:', error);
      return { 
        success: false, 
        message: `Failed to apply RLS policies: ${error.message}` 
      };
    }

    return { 
      success: true, 
      message: 'Document content RLS policies applied successfully' 
    };
  } catch (error) {
    console.error('Unexpected error fixing document content RLS:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
