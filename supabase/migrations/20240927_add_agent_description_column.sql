-- Add agent_description column to ai_agents table if it doesn't exist
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS agent_description text;

-- Add settings column if it doesn't exist
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

-- Migrate existing agent descriptions from settings to the new column
UPDATE public.ai_agents
SET agent_description = settings->>'agent_description'
WHERE agent_description IS NULL 
AND settings->>'agent_description' IS NOT NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_agent_description ON ai_agents(agent_description);

-- Log the migration
INSERT INTO client_activities (
  client_id,
  activity_type,
  description,
  metadata
)
SELECT 
  id,
  'system_update',
  'Added agent_description column to ai_agents table',
  jsonb_build_object(
    'migration_date', NOW(),
    'migration_type', 'add_agent_description_column'
  )
FROM clients 
WHERE id = (SELECT MIN(id) FROM clients)
LIMIT 1; 