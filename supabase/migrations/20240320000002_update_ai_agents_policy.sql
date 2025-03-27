
-- Enable RLS on ai_agents table
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert
CREATE POLICY "Allow service role to insert" ON ai_agents
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create policy to allow service role to select
CREATE POLICY "Allow service role to select" ON ai_agents
    FOR SELECT
    TO service_role
    USING (true); 
