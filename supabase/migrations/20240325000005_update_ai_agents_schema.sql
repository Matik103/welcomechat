-- Add user_id column to ai_agents table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'ai_agents' AND column_name = 'user_id') THEN
        ALTER TABLE ai_agents
        ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add created_at and updated_at columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'ai_agents' AND column_name = 'created_at') THEN
        ALTER TABLE ai_agents
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'ai_agents' AND column_name = 'updated_at') THEN
        ALTER TABLE ai_agents
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

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
COMMENT ON COLUMN ai_agents.user_id IS 'The ID of the user who owns this AI agent';
COMMENT ON COLUMN ai_agents.created_at IS 'Timestamp when the AI agent was created';
COMMENT ON COLUMN ai_agents.updated_at IS 'Timestamp when the AI agent was last updated'; 