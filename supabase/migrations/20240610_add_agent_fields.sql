
-- Add fields needed for agent display
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 0;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS average_response_time NUMERIC DEFAULT 0.0;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Create index on commonly searched fields
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_name ON ai_agents(name);
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON ai_agents(client_id);

-- Update the function to get agent information
CREATE OR REPLACE FUNCTION get_agent_dashboard_stats(
    client_id_param UUID,
    agent_name_param TEXT
)
RETURNS TABLE (
    total_interactions BIGINT,
    active_days INTEGER,
    average_response_time NUMERIC,
    top_queries JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) as total_interactions,
            COUNT(DISTINCT DATE(created_at)) as active_days,
            COALESCE(AVG(response_time_ms)::numeric / 1000, 0) as average_response_time
        FROM ai_agents
        WHERE client_id = client_id_param
            AND name = agent_name_param
            AND interaction_type = 'chat_interaction'
    ),
    top_queries AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'query_text', query_text,
                'frequency', COUNT(*)
            )
        ) as queries
        FROM ai_agents
        WHERE client_id = client_id_param
            AND name = agent_name_param
            AND interaction_type = 'chat_interaction'
            AND query_text IS NOT NULL
        GROUP BY query_text
        ORDER BY COUNT(*) DESC
        LIMIT 5
    )
    SELECT
        stats.total_interactions,
        stats.active_days,
        stats.average_response_time,
        COALESCE(top_queries.queries, '[]'::jsonb)
    FROM stats
    CROSS JOIN top_queries;
END;
$$ LANGUAGE plpgsql;
