
import { supabase } from '@/integrations/supabase/client';

export async function checkDocumentLinksRLS() {
  try {
    // Try to access document_links table
    const { data, error } = await supabase
      .from('document_links')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Document links RLS check failed:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
    
    return {
      success: true,
      message: 'Document links RLS working correctly'
    };
  } catch (err) {
    console.error('Error checking document links RLS:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
      error: err
    };
  }
}

export async function fixDocumentLinksRLS() {
  try {
    // Call a stored function that will fix permissions
    // This is a simplified version that would be replaced with actual RLS fix
    const { data, error } = await supabase
      .rpc('fix_document_links_permissions');
    
    if (error) {
      console.error('Failed to fix document links permissions:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
    
    return {
      success: true,
      message: 'Document links permissions fixed successfully'
    };
  } catch (err) {
    console.error('Error fixing document links RLS:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
      error: err
    };
  }
}
