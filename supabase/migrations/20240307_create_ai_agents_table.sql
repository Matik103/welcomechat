
-- Create AI agents table with DeepSeek integration support
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  name TEXT NOT NULL,
  agent_name TEXT,
  agent_description TEXT,
  logo_url TEXT,
  logo_storage_path TEXT,
  client_name TEXT,
  type TEXT,
  interaction_type TEXT NOT NULL DEFAULT 'config',
  status TEXT DEFAULT 'active',
  settings JSONB DEFAULT '{}'::jsonb,
  openai_enabled BOOLEAN DEFAULT false,
  openai_assistant_id TEXT,
  deepseek_enabled BOOLEAN DEFAULT true,
  deepseek_model TEXT DEFAULT 'deepseek-chat',
  deepseek_assistant_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, interaction_type)
);

-- Add RLS policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Add policies for authenticated users
CREATE POLICY "Users can read their own agents"
ON ai_agents FOR SELECT
USING (client_id = auth.uid());

CREATE POLICY "Users can insert their own agents"
ON ai_agents FOR INSERT 
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own agents"
ON ai_agents FOR UPDATE
USING (client_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS ai_agents_client_id_idx ON ai_agents (client_id);
