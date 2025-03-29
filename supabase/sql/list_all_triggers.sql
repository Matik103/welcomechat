-- List all triggers in the database
SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_schema,
    trigger_name,
    string_agg(event_manipulation, ',') as event,
    action_timing as activation,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_schema = 'public'
GROUP BY 1,2,3,4,6,7
ORDER BY table_schema, table_name;

-- List all functions in the database
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY schema_name, function_name;

-- List all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'; 