
import { supabase } from '@/integrations/supabase/client';

export const applyDocumentLinksRLS = async () => {
  try {
    // Get the SQL content from the file
    const { data: sqlFileData, error: sqlFileError } = await supabase.storage
      .from('sql-scripts')
      .download('update_document_links_rls.sql');
    
    if (sqlFileError) {
      console.error('Error fetching SQL file:', sqlFileError);
      return { success: false, error: sqlFileError.message };
    }
    
    // Convert the SQL file content to text
    const sqlContent = await sqlFileData.text();
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('Error applying RLS policies:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Successfully applied document_links RLS policies:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error applying RLS policies:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
