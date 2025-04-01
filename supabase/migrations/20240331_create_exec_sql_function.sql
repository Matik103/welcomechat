-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.exec_sql(text, json);

-- Create a function to execute SQL queries with service role permissions
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text, query_params json DEFAULT '[]'::json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Execute the query and return the result
  EXECUTE sql_query INTO result;
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.exec_sql(text, json) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text, json) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.exec_sql(text, json) IS 'Executes SQL queries with service role permissions'; 