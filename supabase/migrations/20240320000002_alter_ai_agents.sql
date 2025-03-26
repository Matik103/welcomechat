-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ai_agents' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE ai_agents ADD COLUMN status agent_status DEFAULT 'active';
    END IF;

    -- Add last_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ai_agents' 
        AND column_name = 'last_active'
    ) THEN
        ALTER TABLE ai_agents ADD COLUMN last_active TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ai_agents' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE ai_agents ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create or update indexes
DROP INDEX IF EXISTS idx_ai_agents_status;
CREATE INDEX idx_ai_agents_status ON ai_agents(status);

DROP INDEX IF EXISTS idx_ai_agents_last_active;
CREATE INDEX idx_ai_agents_last_active ON ai_agents(last_active);

-- Create or update the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or update the trigger
DROP TRIGGER IF EXISTS update_ai_agents_updated_at ON ai_agents;
CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create or update the get_agent_dashboard_stats function
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

-- Create or update the log_client_activity function
CREATE OR REPLACE FUNCTION log_client_activity(
    client_id_param UUID,
    activity_type_param TEXT,
    description_param TEXT,
    metadata_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO client_activities (
        client_id,
        type,
        description,
        metadata
    )
    VALUES (
        client_id_param,
        activity_type_param,
        description_param,
        metadata_param
    )
    RETURNING id INTO activity_id;

    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_agent_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_dashboard_stats TO service_role;
GRANT EXECUTE ON FUNCTION log_client_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_client_activity TO service_role; 