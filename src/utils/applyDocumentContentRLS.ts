
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

export async function giveAssistantAccessToDocument(assistantId: string, documentId: number, clientId: string) {
  try {
    console.log(`Giving assistant ${assistantId} access to document ${documentId}`);
    
    // Check if there's already an assistant_documents record
    const { data: existingRecord, error: checkError } = await supabase
      .from('assistant_documents')
      .select('*')
      .eq('assistant_id', assistantId)
      .eq('document_id', documentId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Failed to check for existing record:', checkError);
    }
    
    if (existingRecord) {
      console.log('Assistant already has access to document, updating status');
      
      // Update existing record
      const { error: updateError } = await supabase
        .from('assistant_documents')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', existingRecord.id);
        
      if (updateError) {
        throw updateError;
      }
    } else {
      // Create a new record
      const { error: insertError } = await supabase
        .from('assistant_documents')
        .insert({
          assistant_id: assistantId,
          document_id: documentId,
          client_id: clientId,
          status: 'ready',
          created_at: new Date().toISOString()
        });
        
      if (insertError) {
        throw insertError;
      }
    }
    
    return {
      success: true,
      message: 'Assistant granted access to document successfully'
    };
  } catch (err) {
    console.error('Error granting assistant access to document:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
      error: err
    };
  }
}
