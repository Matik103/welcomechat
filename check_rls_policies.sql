SELECT json_agg(
  json_build_object(
    'table_name', tablename,
    'policy_name', policyname,
    'roles', roles,
    'cmd', cmd,
    'qual', qual,
    'with_check', with_check
  )
) as policies
FROM pg_policies
WHERE tablename = 'activities'; 