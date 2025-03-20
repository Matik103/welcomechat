
-- This migration removes quotation marks from agent names in both clients and ai_agents tables

-- First, update the clients table to remove quotation marks from agent_name
UPDATE public.clients
SET agent_name = REPLACE(agent_name, '"', '')
WHERE agent_name LIKE '%"%';

-- Then update the ai_agents table to remove quotation marks from name
UPDATE public.ai_agents
SET name = REPLACE(name, '"', '')
WHERE name LIKE '%"%';

-- Also update the agent_description in ai_agents
UPDATE public.ai_agents
SET agent_description = REPLACE(agent_description, '"', '')
WHERE agent_description LIKE '%"%';

-- Update settings jsonb field in ai_agents to remove quotation marks from agent_name property
UPDATE public.ai_agents
SET settings = jsonb_set(
  settings,
  '{agent_name}',
  to_jsonb(REPLACE(settings->>'agent_name', '"', '')),
  false
)
WHERE settings->>'agent_name' LIKE '%"%';

-- Log this operation in the client_activities table
INSERT INTO public.client_activities (
  client_id,
  activity_type,
  description,
  metadata,
  created_at
)
SELECT 
  a.client_id,
  'client_updated'::activity_type_enum as activity_type,
  'Removed quotation marks from agent names and descriptions',
  jsonb_build_object(
    'migration_type', 'sanitize_agent_names',
    'migration_date', NOW()
  ),
  NOW()
FROM public.ai_agents a
JOIN public.clients c ON a.client_id = c.id
GROUP BY a.client_id
LIMIT 1;

-- Log migration in schema_migrations table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'schema_migrations') THEN
    INSERT INTO schema_migrations (version, name) 
    VALUES ('20240922_sanitize_agent_names', 'Removed quotation marks from agent names');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Do nothing if table doesn't exist
END $$;
