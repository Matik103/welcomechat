
import { supabase } from "@/integrations/supabase/client";

/**
 * Execute SQL query with parameters
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export const execSql = async (sql: string, params: any[]): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sql,
      params: params
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("SQL execution error:", error);
    throw error;
  }
};

/**
 * Call an RPC function
 * @param functionName The RPC function name
 * @param params Function parameters
 * @returns Function result
 */
export const callRpcFunction = async (functionName: string, params: any): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error calling RPC function ${functionName}:`, error);
    throw error;
  }
};

/**
 * Check if a table exists in the database
 * @param tableName The table name to check
 * @returns Whether the table exists
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const sql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
      ) as exists
    `;
    
    const result = await execSql(sql, [tableName]);
    return result && result.length > 0 && result[0].exists === true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};
