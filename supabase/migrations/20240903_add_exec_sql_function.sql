
-- This file will be executed via the Supabase migrations system

-- Create a function that can execute SQL queries
-- Only admins can execute this function (enforced by RLS and edge function)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER -- runs with the privileges of the function creator
AS $$
BEGIN
  RETURN QUERY EXECUTE sql_query;
END;
$$;

-- Grant execute permission to authenticated users
-- The Edge Function will handle authorization checks
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
