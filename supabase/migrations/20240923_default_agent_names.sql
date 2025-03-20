
-- Migration to set a default name for all AI agents

-- Update all null or empty agent names to 'AI Assistant'
UPDATE ai_agents
SET name = 'AI Assistant'
WHERE name IS NULL OR name = '';

-- Set default agent name in clients table to NULL
ALTER TABLE clients ALTER COLUMN agent_name DROP NOT NULL;

-- Set all agent names to NULL, as we're removing this field from the UI
UPDATE clients
SET agent_name = NULL;

-- Log this change in client activities
INSERT INTO client_activities (
  client_id,
  activity_type,
  description,
  metadata
)
SELECT 
  id,
  'system_update',
  'Removed agent name field from application',
  jsonb_build_object(
    'migration_type', 'agent_name_removal',
    'migration_date', NOW()
  )
FROM clients
ORDER BY updated_at DESC
LIMIT 1;
