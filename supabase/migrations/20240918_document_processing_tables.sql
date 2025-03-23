
-- Create document_processing table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.document_processing (
  id BIGSERIAL PRIMARY KEY,
  document_url TEXT NOT NULL,
  client_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  chunks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_document_processing_client_id ON document_processing(client_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_status ON document_processing(status);
CREATE INDEX IF NOT EXISTS idx_document_processing_document_url ON document_processing(document_url);

-- Add RLS policies
ALTER TABLE document_processing ENABLE ROW LEVEL SECURITY;

DO $add_doc_processing_policies$
BEGIN
  -- Enable read access for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_processing' 
    AND schemaname = 'public'
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users" 
    ON document_processing
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  -- Enable insert for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_processing' 
    AND schemaname = 'public'
    AND policyname = 'Enable insert for authenticated users'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users" 
    ON document_processing
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;

  -- Enable update for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_processing' 
    AND schemaname = 'public'
    AND policyname = 'Enable update for authenticated users'
  ) THEN
    CREATE POLICY "Enable update for authenticated users" 
    ON document_processing
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $add_doc_processing_policies$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_document_processing_timestamp()
RETURNS TRIGGER AS $update_timestamp$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$update_timestamp$ language 'plpgsql';

DO $add_trigger$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_document_processing_updated_at'
  ) THEN
    CREATE TRIGGER update_document_processing_updated_at
      BEFORE UPDATE ON document_processing
      FOR EACH ROW
      EXECUTE FUNCTION update_document_processing_timestamp();
  END IF;
END $add_trigger$;

-- Add activity_type enum values for document processing if they don't exist
DO $add_enums$
DECLARE
  enum_exists BOOLEAN;
BEGIN
  -- Check if the enum type exists
  SELECT EXISTS(
    SELECT 1 FROM pg_type 
    WHERE typname = 'activity_type_enum'
  ) INTO enum_exists;
  
  IF enum_exists THEN
    -- Function to safely add values to enum
    CREATE OR REPLACE FUNCTION add_value_to_enum(enum_type text, new_value text)
    RETURNS void AS $add_value_func$
    DECLARE
      exists_check integer;
    BEGIN
      -- Check if the value already exists in the enum
      SELECT 1 INTO exists_check
      FROM pg_enum
      WHERE enumtypid = enum_type::regtype::oid
      AND enumlabel = new_value;
      
      -- If it doesn't exist, add it
      IF exists_check IS NULL THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type, new_value);
      END IF;
    END;
    $add_value_func$ LANGUAGE plpgsql;
    
    -- Add the new enum values
    PERFORM add_value_to_enum('activity_type_enum', 'document_processing_started');
    PERFORM add_value_to_enum('activity_type_enum', 'document_processing_completed');
    PERFORM add_value_to_enum('activity_type_enum', 'document_processing_failed');
    PERFORM add_value_to_enum('activity_type_enum', 'document_stored');
    PERFORM add_value_to_enum('activity_type_enum', 'document_extracted');
    
    -- Drop the helper function
    DROP FUNCTION add_value_to_enum(text, text);
  END IF;
END $add_enums$;
