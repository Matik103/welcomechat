
import { supabase } from '@/integrations/supabase/client';

export async function checkDocumentContentRLS() {
  try {
    // Try to access document_content table
    const { data, error } = await supabase
      .from('document_content')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Document content RLS check failed:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
    
    return {
      success: true,
      message: 'Document content RLS working correctly'
    };
  } catch (err) {
    console.error('Error checking document content RLS:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
      error: err
    };
  }
}

export async function fixDocumentContentRLS() {
  try {
    // Call a stored function that will fix permissions
    // This is a simplified version that would be replaced with actual RLS fix
    const { data, error } = await supabase
      .rpc('fix_document_content_permissions');
    
    if (error) {
      console.error('Failed to fix document content permissions:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
    
    return {
      success: true,
      message: 'Document content permissions fixed successfully'
    };
  } catch (err) {
    console.error('Error fixing document content RLS:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
      error: err
    };
  }
}
