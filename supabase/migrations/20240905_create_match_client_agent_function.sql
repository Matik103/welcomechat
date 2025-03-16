
-- Create a function specifically designed for n8n to query AI agent data by both client_id and agent_name
CREATE OR REPLACE FUNCTION match_client_agent_data(
    client_id_param uuid,
    agent_name_param text,
    limit_param integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    client_id uuid,
    agent_name text,
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
        a.client_id,
        a.name as agent_name,
        a.content,
        a.query_text,
        a.response_time_ms,
        a.is_error,
        a.error_type,
        a.error_message,
        a.created_at,
        a.settings
    FROM ai_agents a
    WHERE 
        a.client_id = client_id_param AND
        a.name = agent_name_param
    ORDER BY a.created_at DESC
    LIMIT limit_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_client_agent_data(uuid, text, integer) TO authenticated;
