-- Create enum for interaction types
CREATE TYPE interaction_type AS ENUM (
  'chat_interaction',
  'config',
  'document_upload',
  'system_event'
);

-- Create enum for agent status
CREATE TYPE agent_status AS ENUM (
  'active',
  'inactive',
  'maintenance',
  'error'
);

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID NOT NULL,
  client_name TEXT,
  agent_description TEXT,
  ai_prompt TEXT,
  assistant_id TEXT,
  openai_assistant_id TEXT,
  interaction_type interaction_type NOT NULL,
  status agent_status DEFAULT 'active',
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  query_text TEXT,
  content TEXT,
  response_time_ms INTEGER,
  error_message TEXT,
  error_status TEXT,
  error_type TEXT,
  is_error BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  settings JSONB,
  model TEXT NOT NULL DEFAULT 'gpt-4',
  embedding TEXT,
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_ai_agents_client_id ON ai_agents(client_id);
CREATE INDEX idx_ai_agents_interaction_type ON ai_agents(interaction_type);
CREATE INDEX idx_ai_agents_status ON ai_agents(status);
CREATE INDEX idx_ai_agents_created_at ON ai_agents(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get agent dashboard stats
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

-- Create function to log client activity
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
GRANT ALL ON TABLE ai_agents TO authenticated;
GRANT ALL ON TABLE ai_agents TO service_role;
GRANT EXECUTE ON FUNCTION get_agent_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_dashboard_stats TO service_role;
GRANT EXECUTE ON FUNCTION log_client_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_client_activity TO service_role; 