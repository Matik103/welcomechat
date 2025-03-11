
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Creates a new AI agent table with the correct structure and permissions
 * Based on the tweoo table setup (which is working properly)
 */
export const createAiAgentTable = async (
  agentName: string
): Promise<boolean> => {
  try {
    // Sanitize agent name to create a valid table name
    const tableName = agentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Create the table based on tweoo structure
    // @ts-ignore - Using exec_sql function that's defined in our migrations
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id BIGSERIAL PRIMARY KEY,
          content TEXT,
          metadata JSONB,
          embedding VECTOR(1536)
        );
        
        -- Apply the same owner as tweoo
        ALTER TABLE ${tableName} OWNER TO postgres;
        
        -- Apply the same permissions as tweoo
        GRANT ALL ON TABLE ${tableName} TO postgres;
        GRANT ALL ON TABLE ${tableName} TO service_role;
        GRANT ALL ON TABLE ${tableName} TO anon;
        GRANT ALL ON TABLE ${tableName} TO authenticated;
        
        -- Set up sequence permissions
        GRANT USAGE, SELECT, UPDATE ON SEQUENCE ${tableName}_id_seq TO postgres;
        GRANT USAGE, SELECT, UPDATE ON SEQUENCE ${tableName}_id_seq TO service_role;
        GRANT USAGE, SELECT, UPDATE ON SEQUENCE ${tableName}_id_seq TO anon;
        GRANT USAGE, SELECT, UPDATE ON SEQUENCE ${tableName}_id_seq TO authenticated;
        
        -- Create RLS policy identical to tweoo
        ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
        
        DO $$
        BEGIN
            BEGIN
                CREATE POLICY "Enable full access for all users" ON ${tableName} 
                FOR ALL USING (true) WITH CHECK (true);
            EXCEPTION WHEN duplicate_object THEN
                -- Policy already exists
            END;
        END
        $$;
      `
    });
    
    if (tableError) {
      console.error(`Error creating table ${tableName}:`, tableError);
      throw tableError;
    }
    
    // Create matching function for semantic search
    // @ts-ignore - Using exec_sql function that's defined in our migrations
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql_query: `
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
    
    console.log(`Successfully created AI agent table: ${tableName} with tweoo-like permissions`);
    return true;
  } catch (error) {
    console.error("Failed to create AI agent table:", error);
    toast.error(`Failed to create AI agent table: ${error.message || error}`);
    return false;
  }
};
