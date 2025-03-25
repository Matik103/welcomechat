-- Create ai_agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id),
    assistant_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI agents"
ON ai_agents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI agents"
ON ai_agents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI agents"
ON ai_agents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI agents"
ON ai_agents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE ai_agents IS 'Table storing AI agents created by users';
COMMENT ON COLUMN ai_agents.id IS 'Unique identifier for the AI agent';
COMMENT ON COLUMN ai_agents.name IS 'Name of the AI agent';
COMMENT ON COLUMN ai_agents.description IS 'Description of the AI agent';
COMMENT ON COLUMN ai_agents.user_id IS 'The ID of the user who owns this AI agent';
COMMENT ON COLUMN ai_agents.assistant_id IS 'The OpenAI Assistant ID associated with this AI agent';
COMMENT ON COLUMN ai_agents.created_at IS 'Timestamp when the AI agent was created';
COMMENT ON COLUMN ai_agents.updated_at IS 'Timestamp when the AI agent was last updated'; 