
-- Enable RLS on ai_agents table
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- First, drop any existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow service role to insert" ON ai_agents;
DROP POLICY IF EXISTS "Allow service role to select" ON ai_agents;
DROP POLICY IF EXISTS "Allow service role full access" ON ai_agents;

-- Create a comprehensive policy that gives the service role full access
CREATE POLICY "Allow service role full access" ON ai_agents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
