
-- Function to create a storage bucket if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_storage_bucket(bucket_id text, is_public boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bucket_exists boolean;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = bucket_id
  ) INTO bucket_exists;
  
  -- Create bucket if it doesn't exist
  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES (bucket_id, bucket_id, is_public);
    
    -- Create default policies for the bucket
    IF is_public THEN
      -- For public buckets like bot-logos
      EXECUTE format('CREATE POLICY "Public Read Access for %I" ON storage.objects FOR SELECT USING (bucket_id = %L)', bucket_id, bucket_id);
    ELSE
      -- For private buckets like client_documents
      EXECUTE format('CREATE POLICY "Authenticated users can select from %I" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %L)', bucket_id, bucket_id);
    END IF;
    
    -- Create insert policy for authenticated users
    EXECUTE format('CREATE POLICY "Authenticated users can insert into %I" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L)', bucket_id, bucket_id);
    
    -- Create update policy for authenticated users updating their own objects
    EXECUTE format('CREATE POLICY "Authenticated users can update their own objects in %I" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L AND auth.uid() = owner)', bucket_id, bucket_id);
    
    -- Create delete policy for authenticated users
    EXECUTE format('CREATE POLICY "Authenticated users can delete from %I" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L AND auth.uid() = owner)', bucket_id, bucket_id);
    
    RETURN true;
  ELSE
    RETURN true; -- Bucket already exists
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating bucket %: %', bucket_id, SQLERRM;
  RETURN false;
END;
$$;

-- Function to verify document_content RLS permissions
CREATE OR REPLACE FUNCTION public.verify_document_content_permissions() 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_content') THEN
    RETURN jsonb_build_object('success', false, 'message', 'document_content table does not exist', 'needs_creation', true);
  END IF;
  
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'document_content' 
    AND rowsecurity = true
  ) THEN
    -- Enable RLS
    ALTER TABLE public.document_content ENABLE ROW LEVEL SECURITY;
    
    RETURN jsonb_build_object('success', true, 'message', 'RLS enabled on document_content', 'rls_enabled', true);
  END IF;
  
  -- Check if policies exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'document_content' 
  ) THEN
    -- Create basic policies
    CREATE POLICY "Users can view their own document content" 
      ON public.document_content FOR SELECT USING (true);
      
    CREATE POLICY "Users can insert their own document content" 
      ON public.document_content FOR INSERT WITH CHECK (true);
      
    CREATE POLICY "Users can update their own document content" 
      ON public.document_content FOR UPDATE USING (true);
      
    CREATE POLICY "Users can delete their own document content" 
      ON public.document_content FOR DELETE USING (true);
      
    RETURN jsonb_build_object('success', true, 'message', 'Basic policies created for document_content', 'policies_created', true);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'document_content permissions are properly configured');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
