
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to execute SQL queries safely via RPC
 * This helps bypass direct table references and is compatible with Supabase changes
 */
export const execSql = async (query: string, params: Record<string, any> = {}) => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: query,
      params: params
    });
    
    if (error) {
      console.error("Error executing SQL:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to execute SQL:", error);
    throw error;
  }
};

/**
 * Helper function to check if a table exists in the database
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = $1
      ) as exists
    `;
    
    const result = await execSql(query, { tableName });
    
    return result && Array.isArray(result) && 
           result.length > 0 && 
           result[0].exists === true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};
