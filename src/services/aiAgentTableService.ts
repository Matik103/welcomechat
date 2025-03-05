
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Ensures that the sequence for an AI agent table has the necessary permissions
 * This helps prevent the "permission denied for sequence" errors
 */
export const setupTablePermissions = async (
  tableName: string
): Promise<boolean> => {
  try {
    // SQL to be executed for setting up permissions
    const sequenceName = `${tableName}_id_seq`;
    
    // First set the table owner to postgres
    const { error: ownerError } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE ${tableName} OWNER TO postgres;`
    });
    
    if (ownerError) {
      console.error(`Error setting owner for table ${tableName}:`, ownerError);
      throw ownerError;
    }
    
    // Grant sequence permissions to various roles
    const { error: permissionsError } = await supabase.rpc('execute_sql', {
      sql: `
        GRANT USAGE, SELECT, UPDATE ON SEQUENCE ${sequenceName} TO service_role;
        GRANT USAGE, SELECT, UPDATE ON SEQUENCE ${sequenceName} TO authenticated;
        GRANT USAGE, SELECT, UPDATE ON SEQUENCE ${sequenceName} TO anon;
      `
    });
    
    if (permissionsError) {
      console.error(`Error granting permissions for sequence ${sequenceName}:`, permissionsError);
      throw permissionsError;
    }
    
    // Create policy to allow access
    const { error: policyError } = await supabase.rpc('execute_sql', {
      sql: `
        DO $$
        BEGIN
            BEGIN
                EXECUTE 'CREATE POLICY "Enable sequence usage for all users" ON ${tableName} FOR ALL USING (true) WITH CHECK (true)';
            EXCEPTION WHEN duplicate_object THEN
                -- Policy already exists, do nothing
            END;
        END
        $$;
      `
    });
    
    if (policyError) {
      console.error(`Error creating policy for table ${tableName}:`, policyError);
      throw policyError;
    }
    
    console.log(`Successfully set up permissions for table ${tableName} and sequence ${sequenceName}`);
    return true;
  } catch (error) {
    console.error(`Failed to set up permissions for table ${tableName}:`, error);
    toast.error(`Failed to set up permissions for AI agent table: ${error.message || error}`);
    return false;
  }
};

/**
 * Creates a new AI agent table with the correct structure and permissions
 * Based on the tweoo table setup
 */
export const createAiAgentTable = async (
  agentName: string
): Promise<boolean> => {
  try {
    // Sanitize agent name to create a valid table name
    const tableName = agentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Create the table
    const { error: tableError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id BIGSERIAL PRIMARY KEY,
          content TEXT,
          metadata JSONB,
          embedding VECTOR(1536)
        );
      `
    });
    
    if (tableError) {
      console.error(`Error creating table ${tableName}:`, tableError);
      throw tableError;
    }
    
    // Create matching function for semantic search
    const { error: functionError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION match_${tableName}(
          query_embedding VECTOR(1536),
          match_count INTEGER DEFAULT NULL,
          filter JSONB DEFAULT '{}'::JSONB
        ) RETURNS TABLE (
          id BIGINT,
          content TEXT,
          metadata JSONB,
          similarity DOUBLE PRECISION
        )
        LANGUAGE plpgsql
        AS $$
        #variable_conflict use_column
        BEGIN
          RETURN query
          SELECT
            id,
            content,
            metadata,
            1 - (${tableName}.embedding <=> query_embedding) as similarity
          FROM ${tableName}
          WHERE metadata @> filter
          ORDER BY ${tableName}.embedding <=> query_embedding
          LIMIT match_count;
        END;
        $$;
      `
    });
    
    if (functionError) {
      console.error(`Error creating function for table ${tableName}:`, functionError);
      throw functionError;
    }
    
    // Set up permissions for the new table
    const permissionsSetup = await setupTablePermissions(tableName);
    if (!permissionsSetup) {
      throw new Error("Failed to set up permissions for the new table");
    }
    
    console.log(`Successfully created AI agent table: ${tableName}`);
    return true;
  } catch (error) {
    console.error("Failed to create AI agent table:", error);
    toast.error(`Failed to create AI agent table: ${error.message || error}`);
    return false;
  }
};
