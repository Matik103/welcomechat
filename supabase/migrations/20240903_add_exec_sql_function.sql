
-- This file will be executed via the Supabase migrations system

-- Create a function that can execute SQL queries
-- Only admins can execute this function (enforced by RLS and edge function)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- runs with the privileges of the function creator
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
-- The Edge Function will handle authorization checks
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
