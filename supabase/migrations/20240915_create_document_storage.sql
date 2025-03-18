
-- Create client_documents storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'client_documents'
  ) THEN
    INSERT INTO storage.buckets(id, name, public)
    VALUES ('client_documents', 'Client Documents Storage', true);
    
    -- Create public policy for client_documents bucket
    INSERT INTO storage.policies(name, definition, bucket_id)
    VALUES
      ('Public Read Access', '(bucket_id = ''client_documents''::text)', 'client_documents'),
      ('Client Upload Access', '(bucket_id = ''client_documents''::text AND auth.uid() = (storage.foldername(name))[1]::uuid)', 'client_documents');
  END IF;
END
$$;

-- Add document_type column to google_drive_links table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'google_drive_links'
    AND column_name = 'document_type'
  ) THEN
    ALTER TABLE google_drive_links 
    ADD COLUMN document_type text DEFAULT 'google_drive'::text;
  END IF;
END
$$;
