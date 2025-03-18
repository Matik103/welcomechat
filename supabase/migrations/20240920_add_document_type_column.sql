
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
    
    -- Add a log in client_activities
    INSERT INTO client_activities (
      activity_type,
      description,
      metadata
    ) VALUES (
      'system_update',
      'Added document_type column to google_drive_links table',
      jsonb_build_object(
        'migration_date', now(),
        'details', 'Added document_type column to support different document types in document sources'
      )
    );
  END IF;
END
$$;
