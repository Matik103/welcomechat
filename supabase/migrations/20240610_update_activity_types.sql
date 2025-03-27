
-- Update the activity_type_enum to include all necessary values
DO $$
BEGIN
  -- First create a temporary type with all the values we want
  CREATE TYPE activity_type_enum_new AS ENUM (
    'document_uploaded',
    'document_processing_started',
    'document_processing_completed',
    'document_processing_failed',
    'openai_assistant_document_added',
    'openai_assistant_upload_failed',
    'schema_update',
    'client_created',
    'client_updated',
    'client_deleted',
    'client_recovered',
    'widget_settings_updated',
    'website_url_added',
    'website_url_deleted',
    'website_url_processed',
    'drive_link_added',
    'drive_link_deleted',
    'document_link_added',
    'document_link_deleted',
    'document_processed',
    'document_stored',
    'agent_name_updated',
    'agent_description_updated',
    'agent_updated',
    'agent_logo_updated',
    'ai_agent_updated',
    'ai_agent_created',
    'ai_agent_table_created',
    'error_logged',
    'system_update',
    'common_query_milestone',
    'interaction_milestone',
    'growth_milestone',
    'webhook_sent',
    'signed_out',
    'email_sent',
    'invitation_sent',
    'invitation_accepted',
    'logo_uploaded',
    'url_deleted',
    'source_deleted',
    'source_added',
    'widget_previewed',
    'user_role_updated',
    'login_success',
    'login_failed',
    'embed_code_copied',
    'agent_error',
    'chat_interaction',
    'account_created'
  );

  -- Create a temporary table to store existing activity records
  CREATE TEMP TABLE temp_activities AS 
  SELECT id, activity_type::text AS activity_type, client_id, description, metadata, created_at
  FROM client_activities;

  -- Drop the column that uses the old enum
  ALTER TABLE client_activities DROP COLUMN activity_type;

  -- Drop the old enum and recreate it with the new values
  DROP TYPE activity_type_enum;
  ALTER TYPE activity_type_enum_new RENAME TO activity_type_enum;

  -- Add the column back with the new enum type
  ALTER TABLE client_activities ADD COLUMN activity_type activity_type_enum;

  -- Restore the data with safe casting
  UPDATE client_activities SET 
    activity_type = CASE
      WHEN temp.activity_type IN (
        'document_uploaded', 'document_processing_started', 'document_processing_completed',
        'document_processing_failed', 'openai_assistant_document_added', 'openai_assistant_upload_failed',
        'schema_update', 'client_created', 'client_updated', 'client_deleted', 'client_recovered',
        'widget_settings_updated', 'website_url_added', 'website_url_deleted', 'website_url_processed',
        'drive_link_added', 'drive_link_deleted', 'document_link_added', 'document_link_deleted',
        'document_processed', 'document_stored', 'agent_name_updated', 'agent_description_updated',
        'agent_updated', 'agent_logo_updated', 'ai_agent_updated', 'ai_agent_created',
        'ai_agent_table_created', 'error_logged', 'system_update', 'common_query_milestone',
        'interaction_milestone', 'growth_milestone', 'webhook_sent', 'signed_out', 'email_sent',
        'invitation_sent', 'invitation_accepted', 'logo_uploaded', 'url_deleted', 'source_deleted',
        'source_added', 'widget_previewed', 'user_role_updated', 'login_success', 'login_failed',
        'embed_code_copied', 'agent_error', 'chat_interaction', 'account_created'
      ) THEN 
        temp.activity_type::activity_type_enum
      ELSE 
        'system_update'::activity_type_enum -- Default value for any that can't be directly cast
    END
  FROM temp_activities temp
  WHERE client_activities.id = temp.id;

  -- Drop the temporary table
  DROP TABLE temp_activities;

  -- Make the column non-nullable again
  ALTER TABLE client_activities ALTER COLUMN activity_type SET NOT NULL;
END $$;
