
-- This migration updates the activity_type enum in the database to include client_* actions

-- First, drop the existing activity_type enum if it exists
DROP TYPE IF EXISTS activity_type CASCADE;

-- Create the new activity_type enum with all valid values
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
  'client_created',
  'client_updated',
  'client_deleted'
);

-- Update the activities table to use the new enum
ALTER TABLE activities
  ALTER COLUMN type TYPE activity_type USING type::activity_type;

-- Update the ai_agents table to use text instead of enum for type to avoid issues
ALTER TABLE ai_agents
  ALTER COLUMN type TYPE text;

-- Update any existing invalid values in ai_agents table
UPDATE ai_agents
SET type = 'document_added'
WHERE type NOT IN (
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
  'client_created',
  'client_updated',
  'client_deleted'
) OR type IS NULL;

-- Add a comment to the enum type for documentation
COMMENT ON TYPE activity_type IS 'Valid activity types for the application';
