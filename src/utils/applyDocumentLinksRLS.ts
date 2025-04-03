
import { supabase } from '@/integrations/supabase/client';
import { executeRlsUpdate } from '@/utils/rpcUtils';

/**
 * Fix the RLS policies for the document_links table
 * This helps ensure proper access control for document links
 */
export const fixDocumentLinksRLS = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('Applying RLS policies to document_links table...');
    
    // SQL to update RLS policies for document_links
    const sqlQuery = `
      -- Enable RLS on document_links table
      ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies for a clean slate
      DROP POLICY IF EXISTS "Service role has full access to document links" ON document_links;
      DROP POLICY IF EXISTS "Authenticated users can manage document links" ON document_links;
      DROP POLICY IF EXISTS "Users can view their own document links" ON document_links;
      DROP POLICY IF EXISTS "Users can insert their own document links" ON document_links;
      DROP POLICY IF EXISTS "Users can update their own document links" ON document_links;
      DROP POLICY IF EXISTS "Users can delete their own document links" ON document_links;
      
      -- Create policies for service role
      CREATE POLICY "Service role has full access to document links"
          ON document_links
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
      
      -- Create policies for authenticated users
      CREATE POLICY "Authenticated users can manage document links"
          ON document_links
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
    `;
    
    // Execute the SQL to update RLS policies
    const success = await executeRlsUpdate(sqlQuery);
    
    if (success) {
      console.log('RLS policies for document_links applied successfully');
      return { success: true };
    } else {
      return { 
        success: false, 
        message: 'Failed to apply RLS policies for document_links'
      };
    }
  } catch (error) {
    console.error('Error fixing document links RLS:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Create RPC functions for document storage
 * These functions provide a way to interact with the document-storage table
 */
export const createDocumentStorageRpcFunctions = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('Creating RPC functions for document storage...');
    
    // SQL to create RPC functions for document storage
    const sqlQuery = `
      -- Function to store document text
      CREATE OR REPLACE FUNCTION store_document_text(
        p_client_id UUID,
        p_document_name TEXT,
        p_document_text TEXT,
        p_storage_path TEXT,
        p_file_size INTEGER,
        p_mime_type TEXT
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        new_id INTEGER;
        result JSONB;
      BEGIN
        -- Insert record into document-storage
        INSERT INTO "document-storage"
          (client_id, document_name, document_text, storage_path, file_size, mime_type)
        VALUES
          (p_client_id, p_document_name, p_document_text, p_storage_path, p_file_size, p_mime_type)
        RETURNING id INTO new_id;
        
        -- Return success response
        result := jsonb_build_object(
          'success', TRUE,
          'document_id', new_id,
          'message', 'Document text stored successfully'
        );
        
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        -- Return error response
        RETURN jsonb_build_object(
          'success', FALSE,
          'error', SQLERRM
        );
      END;
      $$;
      
      -- Function to get document content
      CREATE OR REPLACE FUNCTION get_document_content(
        p_client_id UUID,
        p_storage_path TEXT
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        document_data JSONB;
      BEGIN
        -- Get document content
        SELECT jsonb_build_object(
          'id', id,
          'document_name', document_name,
          'document_text', document_text,
          'storage_path', storage_path,
          'file_size', file_size,
          'mime_type', mime_type,
          'created_at', created_at
        ) INTO document_data
        FROM "document-storage"
        WHERE client_id = p_client_id AND storage_path = p_storage_path;
        
        -- Return document data
        RETURN document_data;
      EXCEPTION WHEN OTHERS THEN
        -- Return error response
        RETURN jsonb_build_object(
          'error', SQLERRM
        );
      END;
      $$;
      
      -- Function to get client documents
      CREATE OR REPLACE FUNCTION get_client_documents(
        p_client_id UUID
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        documents_data JSONB;
      BEGIN
        -- Get all documents for the client
        SELECT jsonb_agg(jsonb_build_object(
          'id', id,
          'document_name', document_name,
          'storage_path', storage_path,
          'file_size', file_size,
          'mime_type', mime_type,
          'created_at', created_at
        )) INTO documents_data
        FROM "document-storage"
        WHERE client_id = p_client_id;
        
        -- Return documents data
        RETURN documents_data;
      EXCEPTION WHEN OTHERS THEN
        -- Return error response
        RETURN jsonb_build_object(
          'error', SQLERRM
        );
      END;
      $$;
      
      -- Function to get document by path
      CREATE OR REPLACE FUNCTION get_document_by_path(
        p_client_id UUID,
        p_storage_path TEXT
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        document_data JSONB;
      BEGIN
        -- Get document by path
        SELECT jsonb_build_object(
          'id', id,
          'document_name', document_name,
          'document_text', document_text,
          'storage_path', storage_path,
          'file_size', file_size,
          'mime_type', mime_type,
          'created_at', created_at
        ) INTO document_data
        FROM "document-storage"
        WHERE client_id = p_client_id AND storage_path = p_storage_path;
        
        -- Return document data
        RETURN document_data;
      EXCEPTION WHEN OTHERS THEN
        -- Return error response
        RETURN jsonb_build_object(
          'error', SQLERRM
        );
      END;
      $$;
    `;
    
    // Execute the SQL to create RPC functions
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlQuery
    });
    
    if (error) {
      console.error('Error creating RPC functions:', error);
      return { 
        success: false, 
        message: error.message
      };
    }
    
    console.log('RPC functions for document storage created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error creating document storage RPC functions:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
