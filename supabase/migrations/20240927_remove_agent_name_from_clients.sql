-- Remove agent_name column from clients table
ALTER TABLE public.clients 
DROP COLUMN IF EXISTS agent_name;

-- Log the migration
INSERT INTO public.client_activities (
  client_id,
  activity_type,
  description,
  metadata
) VALUES (
  'system',
  'schema_update',
  'Removed agent_name column from clients table',
  '{"migration": "20240927_remove_agent_name_from_clients"}'
); 