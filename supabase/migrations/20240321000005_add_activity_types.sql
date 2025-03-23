-- Add new activity types to the activity_type_enum
DO $$
BEGIN
  -- First, create a temporary column to store the activity type
  ALTER TABLE client_activities ADD COLUMN IF NOT EXISTS activity_type_temp text;
  
  -- Copy the current activity type values to the temporary column
  UPDATE client_activities SET activity_type_temp = activity_type;
  
  -- Drop the existing activity_type column
  ALTER TABLE client_activities DROP COLUMN IF EXISTS activity_type;
  
  -- Create or update the enum type
  IF NOT EXISTS (
    SELECT 1 FROM pg_type_is_visible(to_regtype('public.activity_type_enum'::text)::oid)
  ) THEN
    CREATE TYPE activity_type_enum AS ENUM (
      'chat_interaction',
      'client_created',
      'client_updated',
      'client_deleted',
      'client_recovered',
      'widget_settings_updated',
      'website_url_added',
      'drive_link_added',
      'url_deleted',
      'source_added',
      'source_deleted',
      'agent_name_updated',
      'drive_link_deleted',
      'error_logged',
      'interaction_milestone',
      'common_query_milestone',
      'growth_milestone',
      'ai_agent_table_created',
      'ai_agent_created',
      'document_processing_started',
      'document_processing_completed',
      'document_processing_failed',
      'system_update',
      'ai_agent_updated',
      'document_stored',
      'document_processed',
      'document_link_added',
      'document_link_deleted',
      'document_uploaded',
      'signed_out',
      'embed_code_copied',
      'widget_previewed',
      'openai_assistant_document_added',
      'openai_assistant_upload_failed',
      'schema_update'
    );
  ELSE
    -- Activity types to add
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'chat_interaction';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'client_created';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'client_updated';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'client_deleted';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'client_recovered';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'widget_settings_updated';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'website_url_added';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'drive_link_added';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'url_deleted';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'source_added';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'source_deleted';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'agent_name_updated';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'drive_link_deleted';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'error_logged';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'interaction_milestone';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'common_query_milestone';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'growth_milestone';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'ai_agent_table_created';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'ai_agent_created';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_processing_started';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_processing_completed';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_processing_failed';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'system_update';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'ai_agent_updated';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_stored';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_processed';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_link_added';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_link_deleted';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'document_uploaded';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'signed_out';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'embed_code_copied';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'widget_previewed';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'openai_assistant_document_added';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'openai_assistant_upload_failed';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'schema_update';
  END IF;
  
  -- Add the new activity_type column with the enum type
  ALTER TABLE client_activities ADD COLUMN activity_type activity_type_enum;
  
  -- Update the new column with the values from the temporary column
  UPDATE client_activities SET activity_type = activity_type_temp::activity_type_enum;
  
  -- Drop the temporary column
  ALTER TABLE client_activities DROP COLUMN activity_type_temp;
  
  -- Make the activity_type column NOT NULL
  ALTER TABLE client_activities ALTER COLUMN activity_type SET NOT NULL;
END $$;
