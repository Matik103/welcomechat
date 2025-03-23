-- Update activity types
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Create a temporary table to store existing activity types
  CREATE TABLE temp_activity_types AS
  SELECT id, activity_type::text as activity_type
  FROM client_activities;

  -- Drop the activity_type column from client_activities
  ALTER TABLE client_activities DROP COLUMN activity_type;

  -- Drop the old enum type if it exists
  DO $$
  BEGIN
    -- First, find all columns using this type and change them to text temporarily
    FOR r IN (
      SELECT 
        format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE text USING %I::text',
          nsp.nspname, cls.relname, att.attname, att.attname) as alter_cmd
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_attribute att ON att.atttypid = t.oid
      JOIN pg_class cls ON cls.oid = att.attrelid
      JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
      WHERE t.typname = 'activity_type_enum__old_version_to_be_dropped'
    ) LOOP
      EXECUTE r.alter_cmd;
    END LOOP;
    
    -- Now we can safely drop the type
    DROP TYPE IF EXISTS activity_type_enum__old_version_to_be_dropped;
  END $$;

  -- Create the new enum type
  CREATE TYPE activity_type_enum AS ENUM (
    'account_created',
    'account_deleted',
    'account_updated',
    'agent_created',
    'agent_deleted',
    'agent_updated',
    'document_added',
    'document_deleted',
    'document_processed',
    'document_processing_failed',
    'document_processing_started',
    'document_updated',
    'email_sent',
    'error_occurred',
    'invitation_accepted',
    'invitation_created',
    'invitation_expired',
    'login_failed',
    'login_successful',
    'logout',
    'password_changed',
    'password_reset_requested',
    'profile_updated',
    'role_assigned',
    'role_removed',
    'system_error',
    'system_update',
    'user_invited',
    'verification_failed',
    'verification_successful'
  );

  -- Add the new activity_type column with the new enum type
  ALTER TABLE client_activities ADD COLUMN activity_type activity_type_enum DEFAULT 'system_update';

  -- Update the new column with values from the temporary table
  UPDATE client_activities ca
  SET activity_type = CASE tmp.activity_type
    WHEN 'account_created' THEN 'account_created'::activity_type_enum
    WHEN 'account_deleted' THEN 'account_deleted'::activity_type_enum
    WHEN 'account_updated' THEN 'account_updated'::activity_type_enum
    WHEN 'agent_created' THEN 'agent_created'::activity_type_enum
    WHEN 'agent_deleted' THEN 'agent_deleted'::activity_type_enum
    WHEN 'agent_updated' THEN 'agent_updated'::activity_type_enum
    WHEN 'document_added' THEN 'document_added'::activity_type_enum
    WHEN 'document_deleted' THEN 'document_deleted'::activity_type_enum
    WHEN 'document_processed' THEN 'document_processed'::activity_type_enum
    WHEN 'document_processing_failed' THEN 'document_processing_failed'::activity_type_enum
    WHEN 'document_processing_started' THEN 'document_processing_started'::activity_type_enum
    WHEN 'document_updated' THEN 'document_updated'::activity_type_enum
    WHEN 'email_sent' THEN 'email_sent'::activity_type_enum
    WHEN 'error_occurred' THEN 'error_occurred'::activity_type_enum
    WHEN 'invitation_accepted' THEN 'invitation_accepted'::activity_type_enum
    WHEN 'invitation_created' THEN 'invitation_created'::activity_type_enum
    WHEN 'invitation_expired' THEN 'invitation_expired'::activity_type_enum
    WHEN 'login_failed' THEN 'login_failed'::activity_type_enum
    WHEN 'login_successful' THEN 'login_successful'::activity_type_enum
    WHEN 'logout' THEN 'logout'::activity_type_enum
    WHEN 'password_changed' THEN 'password_changed'::activity_type_enum
    WHEN 'password_reset_requested' THEN 'password_reset_requested'::activity_type_enum
    WHEN 'profile_updated' THEN 'profile_updated'::activity_type_enum
    WHEN 'role_assigned' THEN 'role_assigned'::activity_type_enum
    WHEN 'role_removed' THEN 'role_removed'::activity_type_enum
    WHEN 'system_error' THEN 'system_error'::activity_type_enum
    WHEN 'system_update' THEN 'system_update'::activity_type_enum
    WHEN 'user_invited' THEN 'user_invited'::activity_type_enum
    WHEN 'verification_failed' THEN 'verification_failed'::activity_type_enum
    WHEN 'verification_successful' THEN 'verification_successful'::activity_type_enum
    ELSE 'system_update'::activity_type_enum
  END
  FROM temp_activity_types tmp
  WHERE ca.id = tmp.id;

  -- Drop the temporary table
  DROP TABLE temp_activity_types;
END $$; 