SELECT json_agg(
  json_build_object(
    'table_name', tc.table_name,
    'column_name', kcu.column_name,
    'constraint_type', tc.constraint_type,
    'constraint_name', tc.constraint_name
  )
) as constraints
FROM 
  information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
  tc.table_name IN ('clients', 'ai_agents')
  AND tc.table_schema = 'public'; 