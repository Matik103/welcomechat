CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  openai_assistant_id TEXT,
  assistant_settings JSONB
);

-- Enable Row Level Security
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON ai_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_interaction_type ON ai_agents(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_created_at ON ai_agents(created_at);

-- Create RLS policies
DROP POLICY IF EXISTS ai_agents_select_policy ON ai_agents;
CREATE POLICY ai_agents_select_policy ON ai_agents
  FOR SELECT USING (auth.uid()::text = client_id);

DROP POLICY IF EXISTS ai_agents_insert_policy ON ai_agents;
CREATE POLICY ai_agents_insert_policy ON ai_agents
  FOR INSERT WITH CHECK (auth.uid()::text = client_id);

DROP POLICY IF EXISTS ai_agents_update_policy ON ai_agents;
CREATE POLICY ai_agents_update_policy ON ai_agents
  FOR UPDATE USING (auth.uid()::text = client_id);

DROP POLICY IF EXISTS ai_agents_delete_policy ON ai_agents;
CREATE POLICY ai_agents_delete_policy ON ai_agents
  FOR DELETE USING (auth.uid()::text = client_id); 