SELECT json_agg(
  json_build_object(
    'column_name', column_name,
    'data_type', data_type,
    'is_nullable', is_nullable,
    'column_default', column_default
  )
) as columns
FROM information_schema.columns
WHERE table_name = 'activities'
  AND table_schema = 'public'; 