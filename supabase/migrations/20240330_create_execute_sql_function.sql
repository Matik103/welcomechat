
-- Create a function to execute SQL queries with service role permissions
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.execute_sql(text) IS 'Executes SQL queries with service role permissions'; 
