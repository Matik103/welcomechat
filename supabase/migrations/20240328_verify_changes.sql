-- Verify activity_type enum values
SELECT enum_range(NULL::activity_type);

-- Verify activities table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activities';

-- Verify ai_agents table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_agents';

-- Verify functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('log_activity', 'handle_ai_agent_changes');

-- Verify trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'ai_agent_changes_trigger';

-- Check for any invalid values in ai_agents
SELECT id, type 
FROM ai_agents 
WHERE type IS NULL OR type = 'agent_created'; 