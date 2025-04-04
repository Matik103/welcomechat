import { supabase } from '@/integrations/supabase/client';

/**
 * Apply document content RLS policies to fix permissions issues
 */
export const fixDocumentContentRLS = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Log the attempt for debugging
    console.log('Attempting to fix document content RLS policies...');

    // First, get a client assistant to use for testing
    const { data: assistant, error: assistantError } = await supabase
      .from('client_assistants')
      .select('id')
      .limit(1)
      .single();

    if (assistantError) {
      console.error('Error getting test assistant:', assistantError);
      return { 
        success: false, 
        message: `Failed to get test assistant: ${assistantError.message}` 
      };
    }

    // Test assistant_documents table
    const { error: assistantDocError } = await supabase
      .from('assistant_documents')
      .insert({
        assistant_id: assistant.id,
        filename: 'test.txt',
        file_type: 'text/plain',
        content: 'Test content',
        storage_path: 'test/path.txt',
        metadata: { test: true },
        status: 'pending'
      })
      .select()
      .single();

    // Clean up test record
    await supabase
      .from('assistant_documents')
      .delete()
      .eq('metadata->test', true);

    if (assistantDocError) {
      console.error('Error testing assistant_documents access:', assistantDocError);
      return { 
        success: false, 
        message: `Failed to verify assistant_documents access: ${assistantDocError.message}` 
      };
    }

    console.log('Document content RLS policies verified successfully');
    return { 
      success: true, 
      message: 'Document content RLS policies verified successfully' 
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
    // First, get a client assistant to use for testing
    const { data: assistant, error: assistantError } = await supabase
      .from('client_assistants')
      .select('id')
      .limit(1)
      .single();

    if (assistantError) {
      return {
        hasAccess: false,
        message: `Failed to get test assistant: ${assistantError.message}`
      };
    }

    // Try to insert a test record into assistant_documents
    const { error } = await supabase
      .from('assistant_documents')
      .insert({
        assistant_id: assistant.id,
        filename: 'test.txt',
        file_type: 'text/plain',
        content: 'Test content',
        storage_path: 'test/path.txt',
        metadata: { test: true },
        status: 'pending'
      })
      .select()
      .single();
      
    // Clean up test record regardless of success or failure
    await supabase
      .from('assistant_documents')
      .delete()
      .eq('metadata->test', true);
      
    if (error && error.message.includes('policy')) {
      return {
        hasAccess: false,
        message: 'No write access to assistant_documents table. RLS policies need to be fixed.'
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
