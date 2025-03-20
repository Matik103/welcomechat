-- Add missing columns to ai_agents table
-- This migration adds all the columns being accessed by the application
ALTER TABLE ai_agents 
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS agent_description text,
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS logo_storage_path text,
  ADD COLUMN IF NOT EXISTS ai_prompt text,
  ADD COLUMN IF NOT EXISTS query_text text,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS response_time_ms integer,
  ADD COLUMN IF NOT EXISTS is_error boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS error_type text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS error_status text,
  ADD COLUMN IF NOT EXISTS interaction_type text;
