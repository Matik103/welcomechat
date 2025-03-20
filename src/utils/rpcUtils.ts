
import { supabase } from "@/integrations/supabase/client";

/**
 * Executes a SQL query against the database using RPC
 * @param sqlQuery The SQL query to execute
 * @param params Optional parameters for the query
 * @returns The result of the query
 */
export const execSql = async (sqlQuery: string, params?: any) => {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sqlQuery,
      query_params: params || {}
    });

    if (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in execSql:', error);
    throw error;
  }
};
