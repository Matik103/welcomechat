
-- Check if create_activity function exists and its definition
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'create_activity';

-- Check activities table has the correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'activities';
