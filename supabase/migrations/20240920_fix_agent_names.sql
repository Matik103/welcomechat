
-- Migration to remove " Assistant" suffix from agent names in ai_agents table

-- Update all agent names to remove the " Assistant" suffix if it exists
UPDATE public.ai_agents
SET name = SUBSTRING(name, 1, LENGTH(name) - 10)
WHERE name LIKE '% Assistant';

-- Create a function to log this migration
CREATE OR REPLACE FUNCTION log_agent_name_migration()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INT;
BEGIN
  -- Get count of updated records to log
  SELECT COUNT(*) INTO updated_count 
  FROM public.ai_agents 
  WHERE name LIKE '% Assistant';
  
  -- Log the migration as a system activity
  INSERT INTO public.client_activities (
    client_id,
    activity_type,
    description,
    metadata
  )
  SELECT DISTINCT
    client_id,
    'system_update' as activity_type,
    'Fixed AI agent name format removing " Assistant" suffix',
    jsonb_build_object(
      'migration_type', 'agent_name_fix',
      'migration_date', NOW(),
      'affected_records', updated_count
    )
  FROM public.ai_agents;
  
  RAISE NOTICE 'Updated % AI agent names by removing " Assistant" suffix', updated_count;
END;
$$;

-- Execute the logging function
SELECT log_agent_name_migration();

-- Update clients table to ensure consistency if needed
UPDATE public.clients
SET agent_name = SUBSTRING(agent_name, 1, LENGTH(agent_name) - 10)
WHERE agent_name LIKE '% Assistant';

-- Fix any orphaned AI agent records that might not match client agent_name
-- (adding this to ensure data consistency)
UPDATE public.ai_agents a
SET name = c.agent_name
FROM public.clients c
WHERE a.client_id = c.id
AND c.agent_name IS NOT NULL
AND a.name != c.agent_name;

