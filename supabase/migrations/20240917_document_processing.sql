-- Add new document processing enums if they don't exist
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
    PERFORM add_value_to_enum('activity_type_enum', 'system_update');
    PERFORM add_value_to_enum('activity_type_enum', 'openai_assistant_document_added');
    PERFORM add_value_to_enum('activity_type_enum', 'openai_assistant_upload_failed');
    
    -- Drop the helper function
    DROP FUNCTION add_value_to_enum(text, text);
  END IF;
END $add_enums$;

-- Add agent_description to ai_agents if it doesn't exist
ALTER TABLE public.ai_agents
ADD COLUMN IF NOT EXISTS agent_description TEXT;

-- Create a storage bucket for client documents if it doesn't exist
DO $create_bucket$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('client_documents', 'Client Documents', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Enable RLS on the objects table if not already enabled
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $create_bucket$;

-- Add storage policies if they don't exist
DO $add_policies$
BEGIN
  -- Allow uploads to authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow uploads to authenticated users'
  ) THEN
    CREATE POLICY "Allow uploads to authenticated users" 
    ON storage.objects 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'client_documents');
  END IF;

  -- Allow users to select their own documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow users to select their own documents'
  ) THEN
    CREATE POLICY "Allow users to select their own documents" 
    ON storage.objects 
    FOR SELECT 
    TO authenticated 
    USING (
      bucket_id = 'client_documents' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Allow users to update their own documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow users to update their own documents'
  ) THEN
    CREATE POLICY "Allow users to update their own documents" 
    ON storage.objects 
    FOR UPDATE 
    TO authenticated 
    USING (
      bucket_id = 'client_documents' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Allow users to delete their own documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow users to delete their own documents'
  ) THEN
    CREATE POLICY "Allow users to delete their own documents" 
    ON storage.objects 
    FOR DELETE 
    TO authenticated 
    USING (
      bucket_id = 'client_documents' AND 
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $add_policies$;

-- Update function to copy agent descriptions from client settings
CREATE OR REPLACE FUNCTION update_ai_agents_from_client_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $update_agents$
DECLARE
    client_record RECORD;
    agent_description TEXT;
BEGIN
    -- Loop through all clients with agent_name and widget_settings
    FOR client_record IN
        SELECT 
            id,
            agent_name,
            widget_settings
        FROM clients
        WHERE 
            agent_name IS NOT NULL AND 
            widget_settings IS NOT NULL AND
            widget_settings::text != '{}'::text
    LOOP
        -- Try to extract agent_description from widget_settings
        BEGIN
            agent_description := client_record.widget_settings->>'agent_description';
            
            -- If we found a description, update the ai_agents table
            IF agent_description IS NOT NULL AND LENGTH(agent_description) > 0 THEN
                -- Check if the agent exists first
                IF EXISTS (
                    SELECT 1 
                    FROM ai_agents 
                    WHERE 
                        client_id = client_record.id AND 
                        name = client_record.agent_name
                ) THEN
                    -- Update existing agent
                    UPDATE ai_agents
                    SET 
                        agent_description = agent_description,
                        updated_at = NOW()
                    WHERE 
                        client_id = client_record.id AND 
                        name = client_record.agent_name;
                ELSE
                    -- Create a new agent if it doesn't exist
                    INSERT INTO ai_agents (
                        client_id,
                        name,
                        agent_description,
                        content,
                        settings,
                        interaction_type,
                        created_at,
                        updated_at
                    ) VALUES (
                        client_record.id,
                        client_record.agent_name,
                        agent_description,
                        '',
                        jsonb_build_object(
                            'agent_description', agent_description,
                            'client_id', client_record.id,
                            'migration_date', NOW()::text
                        ),
                        'config',
                        NOW(),
                        NOW()
                    );
                END IF;
                
                RAISE NOTICE 'Updated agent description for client % (agent: %)', 
                    client_record.id, client_record.agent_name;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error processing client %: %', client_record.id, SQLERRM;
        END;
    END LOOP;
END;
$update_agents$;

-- Create document_processing_status table
CREATE TABLE IF NOT EXISTS public.document_processing_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.document_processing_jobs(id),
    status VARCHAR(50) NOT NULL,
    progress INTEGER DEFAULT 0,
    stage VARCHAR(100),
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_doc_processing_status_job_id ON public.document_processing_status(job_id);

-- Create document_processing table
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
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
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $add_trigger$;
