
-- This file contains only the exec_sql function without the match_client_agent_data function
-- We'll add the match_client_agent_data function in a separate migration after this one runs

-- ========== FUNCTION: exec_sql ==========
-- Create a function that can execute SQL queries
-- Only admins can execute this function (enforced by RLS and edge function)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER -- runs with the privileges of the function creator
AS $$
BEGIN
  RETURN QUERY EXECUTE sql_query;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
-- The Edge Function will handle authorization checks
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
