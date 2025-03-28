-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS ai_agent_changes_trigger ON ai_agents;
DROP FUNCTION IF EXISTS handle_ai_agent_changes() CASCADE;
DROP FUNCTION IF EXISTS log_activity(uuid, activity_type, text, jsonb) CASCADE;

-- Drop the existing activity_type enum if it exists
DROP TYPE IF EXISTS activity_type CASCADE;

-- Create the new activity_type enum with valid values
CREATE TYPE activity_type AS ENUM (
  'document_added',
  'document_removed',
  'document_processed',
  'document_processing_failed',
  'url_added',
  'url_removed',
  'url_processed',
  'url_processing_failed',
  'chat_message_sent',
  'chat_message_received',
  'agent_created',
  'agent_updated',
  'agent_deleted',
  'client_created',
  'client_updated',
  'client_deleted'
);

-- Add type column to activities table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'activities' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE activities ADD COLUMN type activity_type;
  END IF;
END $$;

-- Add description column to activities table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'activities' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE activities ADD COLUMN description text;
  END IF;
END $$;

-- Add type column to ai_agents table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ai_agents' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE ai_agents ADD COLUMN type activity_type;
  END IF;
END $$;

-- Create log_activity function
CREATE OR REPLACE FUNCTION log_activity(
  agent_id uuid,
  activity_type activity_type,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO activities (
    ai_agent_id,
    type,
    description,
    metadata,
    created_at
  ) VALUES (
    agent_id,
    activity_type,
    description,
    metadata,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for AI agent changes
CREATE OR REPLACE FUNCTION handle_ai_agent_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NEW.id,
    'agent_updated'::activity_type,
    'AI agent updated: ' || NEW.client_name,
    jsonb_build_object(
      'client_name', NEW.client_name,
      'changes', (
        SELECT jsonb_object_agg(key, value)
        FROM (
          SELECT key, value
          FROM jsonb_each(to_jsonb(NEW))
          EXCEPT
          SELECT key, value
          FROM jsonb_each(to_jsonb(OLD))
        ) diff
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for AI agent changes
CREATE TRIGGER ai_agent_changes_trigger
  AFTER UPDATE ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION handle_ai_agent_changes();

-- Update any existing invalid values in ai_agents table
UPDATE ai_agents
SET type = 'document_added'
WHERE type = 'agent_created' OR type IS NULL;

-- Add a comment to the enum type for documentation
COMMENT ON TYPE activity_type IS 'Valid activity types for the application: document_added, document_removed, document_processed, document_processing_failed, url_added, url_removed, url_processed, url_processing_failed, chat_message_sent, chat_message_received, agent_created, agent_updated, agent_deleted, client_created, client_updated, client_deleted'; 