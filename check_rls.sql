SELECT json_agg(
  json_build_object(
    'table_name', tablename,
    'has_rls', rls_enabled,
    'force_rls', rls_forced
  )
) as rls_info
FROM (
  SELECT 
    tables.tablename,
    tables.rls_enabled,
    tables.rls_forced
  FROM pg_tables tables
  WHERE tables.schemaname = 'public'
) t; 