-- Add only the essential columns needed for the form
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_name ON ai_agents(client_name);
CREATE INDEX IF NOT EXISTS idx_ai_agents_email ON ai_agents(email);

-- Log the migration
INSERT INTO public.client_activities (
  client_id,
  activity_type,
  description,
  metadata
) VALUES (
  'system',
  'schema_update',
  'Added essential client columns to ai_agents table',
  '{"migration": "20240321000004_migrate_clients_to_ai_agents"}'
); 