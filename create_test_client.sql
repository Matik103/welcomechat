-- Insert test client and return as JSON
WITH inserted_client AS (
  INSERT INTO clients (client_name, email, status, created_at, updated_at)
  VALUES ('Test Client', 'test@example.com', 'active', NOW(), NOW())
  ON CONFLICT (email) DO UPDATE 
  SET 
    client_name = EXCLUDED.client_name,
    updated_at = NOW()
  RETURNING to_json(clients.*) as client_data
)
-- Insert AI agent for the test client and return as JSON
INSERT INTO ai_agents (
  client_id,
  name,
  email,
  company,
  model,
  status,
  interaction_type,
  created_at,
  updated_at
)
SELECT 
  (client_data->>'id')::uuid,
  'Test Agent',
  'test@example.com',
  'Test Company',
  'gpt-4',
  'active',
  'config',
  NOW(),
  NOW()
FROM inserted_client
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = NOW()
RETURNING to_json(ai_agents.*) as agent_data; 