-- Create the function to handle client table creation
CREATE OR REPLACE FUNCTION create_ai_agent_table(client_name text)
RETURNS void AS $$
BEGIN
  -- Create the AI agent record if it doesn't exist
  INSERT INTO ai_agents (client_id, agent_name, personality)
  SELECT 
    c.id,
    c.name || ' Agent',
    'I am a helpful AI assistant.'
  FROM clients c
  WHERE c.name = client_name
  AND NOT EXISTS (
    SELECT 1 FROM ai_agents a WHERE a.client_id = c.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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