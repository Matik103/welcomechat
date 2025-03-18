
-- Add new document processing enums if they don't exist
DO $$
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
    RETURNS void AS $$
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
    $$ LANGUAGE plpgsql;
    
    -- Add the new enum values
    PERFORM add_value_to_enum('activity_type_enum', 'document_processing_started');
    PERFORM add_value_to_enum('activity_type_enum', 'document_processing_completed');
    PERFORM add_value_to_enum('activity_type_enum', 'document_processing_failed');
    
    -- Drop the helper function
    DROP FUNCTION add_value_to_enum(text, text);
  END IF;
END $$;

-- Add agent_description to ai_agents if it doesn't exist
ALTER TABLE public.ai_agents
ADD COLUMN IF NOT EXISTS agent_description TEXT;

-- Create a storage bucket for client documents if it doesn't exist
DO $$
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
END $$;

-- Add storage policies if they don't exist
DO $$
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
END $$;

-- Update function to copy agent descriptions from client settings
CREATE OR REPLACE FUNCTION update_ai_agents_from_client_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
