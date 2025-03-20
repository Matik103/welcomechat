
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates and registers a PostgreSQL function with Supabase via RPC
 * Useful for dynamically creating functions that can be reused
 */
export const createRpcFunction = async (
  functionName: string, 
  functionBody: string, 
  parameters: { name: string; type: string; defaultValue?: string }[] = [],
  returnType: string = 'json',
  options: { isStrict?: boolean; volatility?: 'IMMUTABLE' | 'STABLE' | 'VOLATILE' } = {}
): Promise<boolean> => {
  try {
    const paramsList = parameters.map(p => {
      if (p.defaultValue) {
        return `${p.name} ${p.type} DEFAULT ${p.defaultValue}`;
      }
      return `${p.name} ${p.type}`;
    }).join(', ');
    
    const volatility = options.volatility || 'VOLATILE';
    const strictFlag = options.isStrict ? 'STRICT' : '';
    
    const sql = `
      CREATE OR REPLACE FUNCTION ${functionName}(${paramsList}) 
      RETURNS ${returnType} 
      LANGUAGE plpgsql 
      ${volatility}
      ${strictFlag}
      AS $function$
      BEGIN
        ${functionBody}
      END;
      $function$;
    `;
    
    // Execute the SQL to create the function
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });
    
    if (error) {
      console.error(`Error creating function ${functionName}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to create function ${functionName}:`, error);
    return false;
  }
};

/**
 * Get document access status function - creates a reusable RPC for checking document status
 */
export const createGetDocumentAccessStatusFunction = async (): Promise<boolean> => {
  return await createRpcFunction(
    'get_document_access_status',
    `
      DECLARE
        status TEXT;
      BEGIN
        SELECT access_status INTO status FROM document_links WHERE id = document_id;
        RETURN status;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'unknown';
      END;
    `,
    [{ name: 'document_id', type: 'INTEGER' }],
    'TEXT',
    { volatility: 'STABLE', isStrict: true }
  );
};

/**
 * Get AI interactions function - creates a reusable RPC for fetching interactions
 */
export const createGetAiInteractionsFunction = async (): Promise<boolean> => {
  return await createRpcFunction(
    'get_ai_interactions',
    `
      BEGIN
        RETURN QUERY 
        SELECT * FROM ai_agents 
        WHERE client_id = client_id_param 
        AND interaction_type = 'chat'
        ORDER BY created_at DESC;
      END;
    `,
    [{ name: 'client_id_param', type: 'UUID' }],
    'SETOF ai_agents',
    { volatility: 'STABLE', isStrict: true }
  );
};

/**
 * Create and initialize all necessary RPC functions
 */
export const initializeRpcFunctions = async (): Promise<void> => {
  try {
    await createGetDocumentAccessStatusFunction();
    await createGetAiInteractionsFunction();
    
    // Add more function initializations here as needed
    
    console.log('RPC functions initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RPC functions:', error);
  }
};
