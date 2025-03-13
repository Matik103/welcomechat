-- Migrate existing clients to ai_agents table
DO $$ 
BEGIN
  INSERT INTO ai_agents (client_id, agent_name, personality, created_at, updated_at)
  SELECT 
    c.id,
    c.name || ' Agent',
    'I am a helpful AI assistant.',
    c.created_at,
    c.updated_at
  FROM clients c
  WHERE NOT EXISTS (
    SELECT 1 FROM ai_agents a WHERE a.client_id = c.id
  );

  -- Update clients table with ai_agent_id
  UPDATE clients c
  SET ai_agent_id = a.id
  FROM ai_agents a
  WHERE c.id = a.client_id
  AND c.ai_agent_id IS NULL;
END $$; 