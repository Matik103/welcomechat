
-- Add new activity types to the activity_type_enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type_is_visible(to_regtype('public.activity_type_enum'::text)::oid)
  ) THEN
    CREATE TYPE activity_type_enum AS ENUM (
      'openai_assistant_document_added',
      'openai_assistant_upload_failed'
    );
  ELSE
    -- Activity types to add
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'openai_assistant_document_added';
    ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'openai_assistant_upload_failed';
  END IF;
END $$;
