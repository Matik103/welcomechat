-- List all schemas
SELECT nspname 
FROM pg_namespace 
WHERE nspname NOT LIKE 'pg_%' 
AND nspname != 'information_schema';

-- List all functions in all schemas
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
AND pg_get_functiondef(p.oid) LIKE '%description%'
ORDER BY schema_name, function_name;

-- List all triggers in all schemas
SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_schema,
    trigger_name,
    string_agg(event_manipulation, ',') as event,
    action_timing as activation,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY 1,2,3,4,6,7
ORDER BY table_schema, table_name; 