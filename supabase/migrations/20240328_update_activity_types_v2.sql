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
  'chat_message_received'
);

-- Update the activities table to use the new enum
ALTER TABLE activities
  ALTER COLUMN type TYPE activity_type USING type::activity_type;

-- Update the ai_agents table to use the new enum
ALTER TABLE ai_agents
  ALTER COLUMN type TYPE activity_type USING type::activity_type;

-- Update any existing invalid values in ai_agents table
UPDATE ai_agents
SET type = 'document_added'
WHERE type = 'agent_created' OR type IS NULL;

-- Add a comment to the enum type for documentation
COMMENT ON TYPE activity_type IS 'Valid activity types for the application: document_added, document_removed, document_processed, document_processing_failed, url_added, url_removed, url_processed, url_processing_failed, chat_message_sent, chat_message_received'; 