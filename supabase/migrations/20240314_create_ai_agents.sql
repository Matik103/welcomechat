-- Create the ai_agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON ai_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);

-- Add RLS policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all records
CREATE POLICY "service_role_manage_all"
ON ai_agents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 