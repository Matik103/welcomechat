
-- Add DeepSeek assistant ID to ai_agents table if it doesn't exist
DO $$ 
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'deepseek_assistant_id'
  ) THEN
    -- Add the column
    ALTER TABLE ai_agents ADD COLUMN deepseek_assistant_id TEXT;
  END IF;

  -- Check if deepseek_enabled column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'deepseek_enabled'
  ) THEN
    -- Add the column
    ALTER TABLE ai_agents ADD COLUMN deepseek_enabled BOOLEAN DEFAULT true;
  END IF;
  
  -- Check if deepseek_model column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'deepseek_model'
  ) THEN
    -- Add the column
    ALTER TABLE ai_agents ADD COLUMN deepseek_model TEXT DEFAULT 'deepseek-chat';
  END IF;
END $$;

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_deepseek_assistant_id ON ai_agents (deepseek_assistant_id);
