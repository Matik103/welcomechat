
import { supabase } from '@/integrations/supabase/client';

/**
 * Apply document content RLS policies to fix permissions issues
 */
export const fixDocumentContentRLS = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Log the attempt for debugging
    console.log('Attempting to fix document content RLS policies...');

    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          -- Fix RLS policies for document_content table
          ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;
          
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Enable document_content access for authenticated users" ON document_content;
          
          -- Create policy that allows authenticated users to SELECT from document_content
          CREATE POLICY "Enable document_content access for authenticated users"
          ON document_content FOR SELECT
          TO authenticated
          USING (true);

          -- Create policy that allows authenticated users to INSERT into document_content
          CREATE POLICY "Enable document_content insert for authenticated users"
          ON document_content FOR INSERT
          TO authenticated
          WITH CHECK (true);

          -- Create policy that allows authenticated users to UPDATE document_content
          CREATE POLICY "Enable document_content update for authenticated users"
          ON document_content FOR UPDATE
          TO authenticated
          USING (true)
          WITH CHECK (true);
          
          -- Apply the same policies to assistant_documents if it exists
          DO $$
          BEGIN
            IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'assistant_documents') THEN
              ALTER TABLE assistant_documents ENABLE ROW LEVEL SECURITY;
              
              DROP POLICY IF EXISTS "Enable assistant_documents access for authenticated users" ON assistant_documents;
              
              CREATE POLICY "Enable assistant_documents access for authenticated users"
              ON assistant_documents FOR ALL
              TO authenticated
              USING (true)
              WITH CHECK (true);
            END IF;
          END $$;
        `
      });

    if (error) {
      console.error('Error applying document content RLS policies:', error);
      return { 
        success: false, 
        message: `Failed to apply RLS policies: ${error.message}` 
      };
    }

    console.log('Document content RLS policies applied successfully');
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

/**
 * Check document content RLS policies
 */
export const checkDocumentContentRLS = async (): Promise<{ hasAccess: boolean; message: string }> => {
  try {
    // Try to insert a test record into document_content
    const { error } = await supabase
      .from('document_content')
      .insert({
        client_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        document_id: 'test-' + Date.now(),
        content: 'RLS Test',
        filename: 'test.txt',
        file_type: 'text/plain',
        metadata: { test: true }
      })
      .select()
      .single();
      
    // Clean up test record regardless of success or failure
    await supabase
      .from('document_content')
      .delete()
      .eq('metadata->test', true);
      
    if (error && error.message.includes('policy')) {
      return {
        hasAccess: false,
        message: 'No write access to document_content table. RLS policies need to be fixed.'
      };
    }
    
    return {
      hasAccess: true,
      message: 'Document content RLS policies appear to be working'
    };
  } catch (error) {
    console.error('Error checking document content RLS:', error);
    return {
      hasAccess: false,
      message: `Error checking permissions: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
