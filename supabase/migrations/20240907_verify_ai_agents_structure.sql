
-- Verify if the ai_agents table has the required structure
-- This migration will check for missing columns and add them if needed

-- The table might already have these columns, so we'll use IF NOT EXISTS

-- Add missing columns to ai_agents table
ALTER TABLE IF EXISTS ai_agents 
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS url text,
ADD COLUMN IF NOT EXISTS interaction_type text, -- 'query', 'response', 'error', etc.
ADD COLUMN IF NOT EXISTS query_text text,       -- Store the original query for common queries tracking
ADD COLUMN IF NOT EXISTS response_time_ms integer, -- For tracking response times
ADD COLUMN IF NOT EXISTS is_error boolean DEFAULT false, -- Flag for error logs
ADD COLUMN IF NOT EXISTS error_type text,       -- For categorizing errors
ADD COLUMN IF NOT EXISTS error_message text,    -- For detailed error information
ADD COLUMN IF NOT EXISTS error_status text DEFAULT 'pending', -- 'pending', 'resolved', etc.
ADD COLUMN IF NOT EXISTS topic text,            -- For categorizing into common topics
ADD COLUMN IF NOT EXISTS sentiment text;        -- For tracking user sentiment (optional)

-- Create indexes for better query performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON ai_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_name ON ai_agents(name);
CREATE INDEX IF NOT EXISTS idx_ai_agents_url ON ai_agents(url);
CREATE INDEX IF NOT EXISTS idx_ai_agents_settings ON ai_agents USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_ai_agents_interaction_type ON ai_agents(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_error ON ai_agents(is_error);
CREATE INDEX IF NOT EXISTS idx_ai_agents_query_text ON ai_agents(query_text);
CREATE INDEX IF NOT EXISTS idx_ai_agents_created_at ON ai_agents(created_at);

-- Check if RLS is enabled, and enable it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'ai_agents' 
    AND rowsecurity = true
  ) THEN
    EXECUTE 'ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'ai_agents' 
    AND policyname = 'Clients can access only their AI agent data'
  ) THEN
    CREATE POLICY "Clients can access only their AI agent data" 
    ON ai_agents 
    FOR ALL
    USING (client_id = auth.uid()::uuid);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'ai_agents' 
    AND policyname = 'Service role can access all AI agent data'
  ) THEN
    CREATE POLICY "Service role can access all AI agent data" 
    ON ai_agents 
    FOR ALL
    TO service_role 
    USING (true);
  END IF;
END
$$;

-- Create helper functions for ai_agents
-- Create match_ai_agents function
CREATE OR REPLACE FUNCTION match_ai_agents(
    client_id_param uuid,
    agent_name_param text,
    query_embedding vector(1536),
    match_count integer DEFAULT 10,
    additional_filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    id uuid,
    name text,
    content text,
    settings jsonb,
    similarity float,
    url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.content,
        e.settings,
        1 - (e.embedding <=> query_embedding) as similarity,
        e.url
    FROM ai_agents e
    WHERE 
        e.client_id = client_id_param AND
        e.name = agent_name_param AND
        (additional_filter IS NULL OR e.settings @> additional_filter) AND
        e.embedding IS NOT NULL
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_agent_dashboard_stats(
    client_id_param uuid,
    agent_name_param text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats_json json;
    total_interactions integer;
    active_days integer;
    avg_response_time numeric;
BEGIN
    -- Get total interactions
    SELECT COUNT(*)
    INTO total_interactions
    FROM ai_agents
    WHERE 
        client_id = client_id_param AND
        name = agent_name_param AND
        interaction_type = 'chat_interaction';
    
    -- Get active days
    SELECT COUNT(DISTINCT DATE(created_at))
    INTO active_days
    FROM ai_agents
    WHERE 
        client_id = client_id_param AND
        name = agent_name_param AND
        interaction_type = 'chat_interaction';
    
    -- Get average response time
    SELECT COALESCE(AVG(response_time_ms)::numeric / 1000, 0)
    INTO avg_response_time
    FROM ai_agents
    WHERE 
        client_id = client_id_param AND
        name = agent_name_param AND
        interaction_type = 'chat_interaction' AND
        response_time_ms IS NOT NULL;
    
    -- Build the stats JSON
    SELECT json_build_object(
        'total_interactions', COALESCE(total_interactions, 0),
        'active_days', COALESCE(active_days, 0),
        'average_response_time', avg_response_time,
        'top_queries', (
            SELECT json_agg(q)
            FROM (
                SELECT 
                    query_text,
                    COUNT(*) as frequency
                FROM ai_agents
                WHERE 
                    client_id = client_id_param AND
                    name = agent_name_param AND
                    interaction_type = 'chat_interaction' AND
                    query_text IS NOT NULL
                GROUP BY query_text
                ORDER BY COUNT(*) DESC
                LIMIT 5
            ) q
        )
    ) INTO stats_json;
    
    RETURN stats_json;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION match_ai_agents(uuid, text, vector, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_dashboard_stats(uuid, text) TO authenticated;
