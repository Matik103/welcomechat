
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to execute SQL queries safely via RPC
 * This helps bypass direct table references and is compatible with Supabase changes
 */
export const execSql = async (query: string, params: Record<string, any> = {}) => {
  try {
    // Convert parameters to a format that can be passed to the SQL query
    // We need to convert the params object to a JSON string
    const paramsJson = JSON.stringify(params);
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: query,
      query_params: paramsJson
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
    
    if (result && Array.isArray(result) && result.length > 0) {
      // Check if the 'exists' property is true
      if (typeof result[0] === 'object' && result[0] !== null && 'exists' in result[0]) {
        return result[0].exists === true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Helper function to safely parse JSON responses from RPC calls
 */
export const parseJsonResponse = <T>(data: any): T[] => {
  if (!data) return [];
  if (!Array.isArray(data)) return [];
  
  return data.map(item => {
    // Handle various response formats
    if (typeof item === 'string') {
      try {
        return JSON.parse(item);
      } catch (e) {
        return item as unknown as T;
      }
    }
    return item as T;
  });
};

/**
 * Maps raw JSON data to a typed object
 */
export const mapJsonToObject = <T>(json: any, defaultValues: Partial<T> = {}): T => {
  if (!json) return defaultValues as T;
  
  const result = { ...defaultValues };
  
  // For each property in the default values, try to extract it from the JSON
  for (const key in defaultValues) {
    if (Object.prototype.hasOwnProperty.call(defaultValues, key)) {
      if (json[key] !== undefined) {
        (result as any)[key] = json[key];
      }
    }
  }
  
  return result as T;
};
