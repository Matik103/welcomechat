SELECT json_agg(
  json_build_object(
    'name', p.proname,
    'args', pg_get_function_arguments(p.oid),
    'result', pg_get_function_result(p.oid)
  )
) as functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'; 