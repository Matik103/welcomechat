
import { supabase } from '@/integrations/supabase/client';

/**
 * Apply document content RLS policies to fix permissions issues
 */
export const fixDocumentContentRLS = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Log the attempt for debugging
    console.log('Attempting to fix document content RLS policies...');
    
    // First part: Enable RLS and create basic policies
    const { error: firstPartError } = await supabase.rpc(
      'exec_sql',
      { 
        query: `
          -- Enable RLS on document_content table
          ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;
          
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Enable read for authenticated users" ON document_content;
          DROP POLICY IF EXISTS "Enable write for authenticated users" ON document_content;
          
          -- Create policies for document_content table
          CREATE POLICY "Enable read for authenticated users" 
          ON document_content FOR SELECT 
          TO authenticated 
          USING (true);
          
          CREATE POLICY "Enable write for authenticated users" 
          ON document_content FOR INSERT 
          TO authenticated 
          WITH CHECK (true);
        `
      }
    );
    
    if (firstPartError) {
      console.error('Error applying first part of RLS policies:', firstPartError);
      return {
        success: false,
        message: `Failed to apply first part of RLS policies: ${firstPartError.message}`
      };
    }
    
    // Second part: Create update and delete policies
    const { error: secondPartError } = await supabase.rpc(
      'exec_sql',
      { 
        query: `
          -- Create update and delete policies
          DROP POLICY IF EXISTS "Enable update for authenticated users" ON document_content;
          DROP POLICY IF EXISTS "Enable delete for authenticated users" ON document_content;
          
          CREATE POLICY "Enable update for authenticated users" 
          ON document_content FOR UPDATE 
          TO authenticated 
          USING (true) 
          WITH CHECK (true);
          
          CREATE POLICY "Enable delete for authenticated users" 
          ON document_content FOR DELETE 
          TO authenticated 
          USING (true);
          
          -- Similar policies for assistant_documents table
          ALTER TABLE assistant_documents ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Enable read for authenticated users" ON assistant_documents;
          DROP POLICY IF EXISTS "Enable write for authenticated users" ON assistant_documents;
          
          CREATE POLICY "Enable read for authenticated users" 
          ON assistant_documents FOR SELECT 
          TO authenticated 
          USING (true);
          
          CREATE POLICY "Enable write for authenticated users" 
          ON assistant_documents FOR ALL 
          TO authenticated 
          WITH CHECK (true);
        `
      }
    );
      
    if (secondPartError) {
      console.error('Error applying second part of RLS policies:', secondPartError);
      return {
        success: false,
        message: `Failed to apply second part of RLS policies: ${secondPartError.message}`
      };
    }

    // Test if policies are working by checking access
    return await checkDocumentContentRLS();
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
export const checkDocumentContentRLS = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // First, get a client assistant to use for testing
    const { data: assistant, error: assistantError } = await supabase
      .from('ai_agents')
      .select('id, openai_assistant_id')
      .eq('interaction_type', 'config')
      .limit(1)
      .maybeSingle();

    // Try to insert a test record into document_content
    const testDocId = 'test_' + Date.now();
    const { error: docError } = await supabase
      .from('document_content')
      .insert({
        client_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
        document_id: testDocId,
        content: 'Test content',
        metadata: { test: true },
        file_type: 'text/plain',
        filename: 'test.txt'
      });
      
    if (!docError || !docError.message.includes('permission denied')) {
      // Clean up test data if successful
      if (!docError) {
        await supabase
          .from('document_content')
          .delete()
          .eq('document_id', testDocId);
      }
      
      return { 
        success: true, 
        message: 'Document content RLS policies are working properly' 
      };
    }
    
    return { 
      success: false, 
      message: 'RLS policies still restricting access. Error: ' + docError.message
    };
  } catch (error) {
    console.error('Error checking document content RLS:', error);
    return {
      success: false,
      message: `Error checking permissions: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
