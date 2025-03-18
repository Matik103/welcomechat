
-- Check if ai_agents table exists and create it if not
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  content text,
  embedding vector(1536),
  settings jsonb DEFAULT '{}'::jsonb NOT NULL,
  interaction_type text,
  is_error boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index on client_id and name for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_name ON ai_agents(client_id, name);

-- Create a function to sync agent name changes
CREATE OR REPLACE FUNCTION sync_agent_name_on_client_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If agent_name has changed, update all corresponding ai_agents records
  IF OLD.agent_name IS DISTINCT FROM NEW.agent_name AND NEW.agent_name IS NOT NULL THEN
    -- Update all ai_agents records with the new name
    UPDATE ai_agents 
    SET 
      name = NEW.agent_name,
      updated_at = NOW()
    WHERE 
      client_id = NEW.id 
      AND name = OLD.agent_name;
      
    -- Log information about the update
    RAISE INFO 'Updated agent name from % to % for client %', 
      OLD.agent_name, NEW.agent_name, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to execute the function on client updates
DROP TRIGGER IF EXISTS sync_agent_names ON clients;
CREATE TRIGGER sync_agent_names
AFTER UPDATE ON clients
FOR EACH ROW
WHEN (OLD.agent_name IS DISTINCT FROM NEW.agent_name)
EXECUTE FUNCTION sync_agent_name_on_client_update();

-- Check for clients without corresponding AI agents and create them
DO $$
DECLARE
  client_record RECORD;
BEGIN
  FOR client_record IN
    SELECT id, agent_name
    FROM clients
    WHERE agent_name IS NOT NULL
  LOOP
    -- Check if the client has an AI agent with matching name
    IF NOT EXISTS (
      SELECT 1 FROM ai_agents 
      WHERE client_id = client_record.id 
      AND name = client_record.agent_name
    ) THEN
      -- Create a default AI agent for this client
      INSERT INTO ai_agents (
        client_id,
        name,
        content,
        settings,
        interaction_type,
        created_at,
        updated_at
      ) VALUES (
        client_record.id,
        client_record.agent_name,
        '',
        jsonb_build_object(
          'created_by', 'system_migration',
          'created_at', NOW()::text
        ),
        'config',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created AI agent for client %', client_record.id;
    END IF;
  END LOOP;
END;
$$;
