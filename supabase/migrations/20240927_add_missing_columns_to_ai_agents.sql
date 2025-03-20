
-- Add missing columns to ai_agents table
-- This migration adds all the columns being accessed by the application
ALTER TABLE IF EXISTS ai_agents 
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS agent_description text,
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS logo_storage_path text,
ADD COLUMN IF NOT EXISTS ai_prompt text,
ADD COLUMN IF NOT EXISTS query_text text,
ADD COLUMN IF NOT EXISTS url text,
ADD COLUMN IF NOT EXISTS response_time_ms integer,
ADD COLUMN IF NOT EXISTS is_error boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS error_type text,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS error_status text,
ADD COLUMN IF NOT EXISTS interaction_type text,
ADD COLUMN IF NOT EXISTS topic text,
ADD COLUMN IF NOT EXISTS sentiment text,
ADD COLUMN IF NOT EXISTS size integer,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS uploadDate timestamp with time zone,
ADD COLUMN IF NOT EXISTS status text;

-- Create a helper function to get common queries
DROP FUNCTION IF EXISTS get_common_queries(uuid, text, integer);
CREATE OR REPLACE FUNCTION get_common_queries(
  client_id_param uuid,
  agent_name_param text,
  limit_param integer
) 
RETURNS TABLE (
  query_text text,
  frequency bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.query_text,
    COUNT(*) as frequency
  FROM ai_agents a
  WHERE 
    a.client_id = client_id_param
    AND (agent_name_param IS NULL OR a.name = agent_name_param)
    AND a.interaction_type = 'chat_interaction'
    AND a.query_text IS NOT NULL
  GROUP BY a.query_text
  ORDER BY frequency DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get agent dashboard stats
DROP FUNCTION IF EXISTS get_agent_dashboard_stats(uuid, text);
CREATE OR REPLACE FUNCTION get_agent_dashboard_stats(
  client_id_param uuid,
  agent_name_param text
) 
RETURNS json AS $$
DECLARE
  total_interactions integer;
  active_days integer;
  avg_response_time numeric;
  top_queries json;
BEGIN
  -- Get total interactions
  SELECT COUNT(*) INTO total_interactions
  FROM ai_agents
  WHERE client_id = client_id_param
    AND name = agent_name_param
    AND interaction_type = 'chat_interaction'
    AND is_error = false;
    
  -- Get active days
  SELECT COUNT(DISTINCT DATE(created_at)) INTO active_days
  FROM ai_agents
  WHERE client_id = client_id_param
    AND name = agent_name_param
    AND interaction_type = 'chat_interaction';
    
  -- Get average response time
  SELECT COALESCE(AVG(response_time_ms)::numeric / 1000, 0) INTO avg_response_time
  FROM ai_agents
  WHERE client_id = client_id_param
    AND name = agent_name_param
    AND interaction_type = 'chat_interaction'
    AND response_time_ms IS NOT NULL;
    
  -- Get top queries
  SELECT json_agg(q) INTO top_queries
  FROM (
    SELECT query_text, COUNT(*) as frequency
    FROM ai_agents
    WHERE client_id = client_id_param
      AND name = agent_name_param
      AND interaction_type = 'chat_interaction'
      AND query_text IS NOT NULL
    GROUP BY query_text
    ORDER BY frequency DESC
    LIMIT 5
  ) q;
  
  -- Return stats as JSON
  RETURN json_build_object(
    'total_interactions', total_interactions,
    'active_days', active_days,
    'average_response_time', avg_response_time,
    'top_queries', COALESCE(top_queries, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_common_queries(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_dashboard_stats(uuid, text) TO authenticated;
