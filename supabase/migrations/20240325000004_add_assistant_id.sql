-- Add assistant_id column to ai_agents table
ALTER TABLE ai_agents
ADD COLUMN assistant_id TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN ai_agents.assistant_id IS 'The OpenAI Assistant ID associated with this AI agent';

-- Add RLS policy for assistant_id
ALTER POLICY "Users can view their own AI agents"
ON ai_agents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

ALTER POLICY "Users can insert their own AI agents"
ON ai_agents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own AI agents"
ON ai_agents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); 