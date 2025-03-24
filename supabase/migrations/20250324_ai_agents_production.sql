-- Enable Row Level Security
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON ai_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_interaction_type ON ai_agents(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_created_at ON ai_agents(created_at);

-- Add OpenAI Assistant columns if they don't exist
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS openai_assistant_id text,
ADD COLUMN IF NOT EXISTS assistant_settings jsonb DEFAULT '{}'::jsonb;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_ai_agents_client_id'
  ) THEN
    ALTER TABLE ai_agents 
    ADD CONSTRAINT fk_ai_agents_client_id 
    FOREIGN KEY (client_id) 
    REFERENCES ai_agents(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON ai_agents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON ai_agents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON ai_agents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON ai_agents
  FOR DELETE
  TO authenticated
  USING (true); 