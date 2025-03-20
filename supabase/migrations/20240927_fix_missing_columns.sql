
-- First, check if agent_name column exists in clients table, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'agent_name'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN agent_name TEXT;
    
    -- Set default value for existing rows
    UPDATE public.clients SET agent_name = 'AI Assistant' WHERE agent_name IS NULL;
  END IF;
END$$;

-- Add missing columns to ai_agents table
DO $$
BEGIN
  -- Add agent_description if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'agent_description'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN agent_description TEXT;
  END IF;

  -- Add content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'content'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN content TEXT;
  END IF;

  -- Add url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'url'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN url TEXT;
  END IF;

  -- Add settings column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add query_text column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'query_text'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN query_text TEXT;
  END IF;

  -- Add response_time_ms column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'response_time_ms'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN response_time_ms INTEGER;
  END IF;

  -- Add is_error column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'is_error'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN is_error BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add error_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'error_type'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN error_type TEXT;
  END IF;

  -- Add error_message column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN error_message TEXT;
  END IF;

  -- Add error_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'error_status'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN error_status TEXT;
  END IF;

  -- Add logo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN logo_url TEXT;
  END IF;

  -- Add logo_storage_path column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'logo_storage_path'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN logo_storage_path TEXT;
  END IF;

  -- Add interaction_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'interaction_type'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN interaction_type TEXT;
  END IF;

  -- Add size column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'size'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN size INTEGER;
  END IF;

  -- Add type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN type TEXT;
  END IF;

  -- Add uploadDate column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'uploadDate'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN "uploadDate" TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN status TEXT;
  END IF;

  -- Add topic column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'topic'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN topic TEXT;
  END IF;

  -- Add sentiment column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'sentiment'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN sentiment TEXT;
  END IF;

  -- Add embedding column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN embedding VECTOR(1536);
  END IF;

  -- Add ai_prompt column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_agents' AND column_name = 'ai_prompt'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN ai_prompt TEXT;
  END IF;
END$$;

-- Log the migration in client_activities
INSERT INTO public.client_activities (
  client_id,
  activity_type,
  description,
  metadata
) VALUES (
  'system',
  'schema_update',
  'Fixed missing columns in clients and ai_agents tables',
  '{"migration": "20240927_fix_missing_columns", "tables_updated": ["clients", "ai_agents"]}'
);
