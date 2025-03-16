
-- Create a function specifically designed for n8n to query AI agent data by client ID
-- This function will show up in n8n's function dropdown
CREATE OR REPLACE FUNCTION match_agent_client(
    client_id_param uuid,
    limit_param integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    agent_name text,
    client_id uuid,
    client_name text,
    content text,
    query_text text,
    response_time_ms integer,
    is_error boolean,
    error_type text,
    error_message text,
    created_at timestamp with time zone,
    settings jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.name as agent_name,
        a.client_id,
        c.client_name,
        a.content,
        a.query_text,
        a.response_time_ms,
        a.is_error,
        a.error_type,
        a.error_message,
        a.created_at,
        a.settings
    FROM ai_agents a
    JOIN clients c ON a.client_id = c.id
    WHERE 
        a.client_id = client_id_param
    ORDER BY a.created_at DESC
    LIMIT limit_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_agent_client(uuid, integer) TO authenticated;

-- Create a function to get distinct agent names for a client
-- This will be useful for n8n when selecting which agent to query
CREATE OR REPLACE FUNCTION get_client_agent_names(
    client_id_param uuid
)
RETURNS TABLE (
    agent_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT name
    FROM ai_agents
    WHERE client_id = client_id_param
    ORDER BY name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_agent_names(uuid) TO authenticated;
