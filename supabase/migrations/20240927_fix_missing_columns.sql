
-- Fix the clients table - Make sure agent_name exists
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS agent_name TEXT DEFAULT 'AI Assistant';

-- Fix the ai_agents table - Add all missing columns
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS agent_description TEXT,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536),
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS interaction_type TEXT,
ADD COLUMN IF NOT EXISTS query_text TEXT,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS is_error BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS error_type TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS error_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS sentiment TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_storage_path TEXT,
ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
ADD COLUMN IF NOT EXISTS size INTEGER,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS "uploadDate" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT;

-- Make sure client interface type has agent_name in all existing rows
UPDATE public.clients 
SET agent_name = 'AI Assistant' 
WHERE agent_name IS NULL;

-- Helper function to get common queries
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

-- Create function to get agent dashboard stats
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
