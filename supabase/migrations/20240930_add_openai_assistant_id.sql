
-- Add openai_assistant_id column to ai_agents table
ALTER TABLE public.ai_agents
ADD COLUMN IF NOT EXISTS openai_assistant_id text;

-- Add index for faster lookups by assistant ID
CREATE INDEX IF NOT EXISTS idx_ai_agents_openai_assistant_id ON ai_agents(openai_assistant_id);

-- Add webhook_url column for custom webhook integration
ALTER TABLE public.ai_agents
ADD COLUMN IF NOT EXISTS webhook_url text;

