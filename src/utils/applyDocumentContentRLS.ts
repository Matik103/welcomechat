
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if document content RLS policies are correctly applied
 */
export const checkDocumentContentRLS = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    // Test if we can insert into document_content table
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('document_content')
      .insert({
        client_id: testId,
        document_id: testId,
        content: 'TEST CONTENT - PLEASE DELETE',
        file_type: 'text/plain',
        filename: 'test.txt'
      })
      .select();

    // If there's no error, the RLS policy is likely working properly
    if (!insertError) {
      console.log('Document content RLS policy check: Success');
      
      // Clean up test entry
      await supabase
        .from('document_content')
        .delete()
        .eq('document_id', testId);
        
      return { success: true };
    }
    
    // If we get a permission denied error, RLS policies need fixing
    if (insertError.message.includes('permission denied') || 
        insertError.message.includes('policy')) {
      return { 
        success: false, 
        message: 'RLS policies need to be updated: ' + insertError.message 
      };
    }
    
    return { 
      success: false, 
      message: insertError.message 
    };
  } catch (error) {
    console.error('Error checking document content RLS:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Applies the necessary RLS policies to allow document content storage
 */
export const fixDocumentContentRLS = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      return { success: false, message: `Auth error: ${userError.message}` };
    }
    
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }
    
    // Execute a stored procedure to fix the RLS policies
    const { data, error } = await supabase.rpc('fix_document_content_rls');
    
    if (error) {
      if (error.message.includes('does not exist')) {
        // Create a manual fix by executing direct SQL to create proper policies
        console.log('Attempting manual RLS policy fix...');
        
        const { data: manualFixData, error: manualFixError } = await supabase.rpc('exec_sql', {
          sql_query: `
            -- Enable RLS on document_content table
            ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;
            
            -- Drop existing policies if they exist
            DROP POLICY IF EXISTS "Users can insert document content" ON document_content;
            DROP POLICY IF EXISTS "Users can select their own document content" ON document_content;
            DROP POLICY IF EXISTS "Users can update their own document content" ON document_content;
            DROP POLICY IF EXISTS "Users can delete their own document content" ON document_content;
            
            -- Allow authenticated users to insert document content
            CREATE POLICY "Users can insert document content"
            ON document_content FOR INSERT TO authenticated
            WITH CHECK (true);
            
            -- Allow authenticated users to select document content they own
            -- or document content related to clients they have access to
            CREATE POLICY "Users can select document content"
            ON document_content FOR SELECT TO authenticated
            USING (
              -- Users can see document content where they are the client
              auth.uid() = client_id
              OR
              -- Or documents associated with clients they have permissions for
              client_id IN (
                SELECT id FROM clients
                WHERE client_id = auth.uid()
                OR id IN (
                  SELECT client_id FROM client_users
                  WHERE user_id = auth.uid()
                )
              )
            );
            
            -- Allow authenticated users to update document content they own
            CREATE POLICY "Users can update document content"
            ON document_content FOR UPDATE TO authenticated
            USING (
              auth.uid() = client_id
              OR
              client_id IN (
                SELECT id FROM clients
                WHERE client_id = auth.uid()
                OR id IN (
                  SELECT client_id FROM client_users
                  WHERE user_id = auth.uid()
                )
              )
            );
            
            -- Allow authenticated users to delete document content they own
            CREATE POLICY "Users can delete document content"
            ON document_content FOR DELETE TO authenticated
            USING (
              auth.uid() = client_id
              OR
              client_id IN (
                SELECT id FROM clients
                WHERE client_id = auth.uid()
                OR id IN (
                  SELECT client_id FROM client_users
                  WHERE user_id = auth.uid()
                )
              )
            );
          `
        });
        
        if (manualFixError) {
          return { success: false, message: `Manual fix failed: ${manualFixError.message}` };
        }
        
        return { success: true, message: 'Applied manual RLS fix' };
      }
      
      return { success: false, message: error.message };
    }
    
    return { 
      success: true,
      message: 'RLS policies have been updated'
    };
  } catch (error) {
    console.error('Error fixing document content RLS:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
