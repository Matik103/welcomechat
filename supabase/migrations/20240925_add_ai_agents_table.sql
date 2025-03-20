
-- Create the ai_agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
    name text NOT NULL,
    agent_description text,
    content text,
    embedding vector(1536),
    url text,
    interaction_type text,
    query_text text,
    response_time_ms integer,
    is_error boolean DEFAULT false,
    error_type text,
    error_message text,
    error_status text DEFAULT 'pending',
    topic text,
    sentiment text,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    logo_url text,
    logo_storage_path text
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON ai_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_name ON ai_agents(name);
CREATE INDEX IF NOT EXISTS idx_ai_agents_interaction_type ON ai_agents(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_error ON ai_agents(is_error);
CREATE INDEX IF NOT EXISTS idx_ai_agents_query_text ON ai_agents(query_text);
CREATE INDEX IF NOT EXISTS idx_ai_agents_created_at ON ai_agents(created_at);

-- Enable RLS
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Clients can access only their AI agent data" 
ON ai_agents 
FOR ALL
USING (client_id = auth.uid()::uuid);

CREATE POLICY "Service role can access all AI agent data" 
ON ai_agents 
FOR ALL
TO service_role 
USING (true);

-- If agent_name has been removed from clients, let's add a migration step to:
-- 1. Create AI agents entries for all clients using their existing agent_name
-- 2. Make sure all clients are linked to AI agents

DO $$
BEGIN
  -- For each client, create an AI agent if one doesn't exist
  INSERT INTO ai_agents (client_id, name, agent_description, settings, created_at, updated_at)
  SELECT 
    c.id, 
    'AI Assistant', -- Use fixed name 
    c.widget_settings->>'agent_description', 
    jsonb_build_object(
      'agent_description', c.widget_settings->>'agent_description',
      'client_id', c.id,
      'migration_date', NOW()::text
    ),
    NOW(),
    NOW()
  FROM clients c
  WHERE NOT EXISTS (
    SELECT 1 FROM ai_agents a WHERE a.client_id = c.id
  );

  -- Log migration
  RAISE NOTICE 'AI Agents migration completed';
END
$$;
