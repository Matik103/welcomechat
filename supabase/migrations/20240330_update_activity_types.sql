
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
  'client_deleted',
  'client_recovered',
  'agent_created',
  'agent_updated',
  'agent_deleted',
  'agent_name_updated',
  'agent_description_updated',
  'agent_error',
  'agent_logo_updated',
  'webhook_sent',
  'email_sent',
  'invitation_sent',
  'invitation_accepted',
  'widget_previewed',
  'user_role_updated',
  'login_success',
  'login_failed',
  'signed_out',
  'widget_settings_updated',
  'logo_uploaded',
  'system_update',
  'source_deleted',
  'source_added'
);

-- Update the activities table to use the new enum
ALTER TABLE activities
  ALTER COLUMN type TYPE activity_type USING type::activity_type;

-- Update the ai_agents table to use text instead of enum for type to avoid issues
ALTER TABLE ai_agents
  ALTER COLUMN type TYPE text;

-- Add a comment to the enum type for documentation
COMMENT ON TYPE activity_type IS 'Valid activity types for the application';
