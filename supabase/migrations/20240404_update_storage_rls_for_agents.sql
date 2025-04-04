-- Drop existing upload policy
DROP POLICY IF EXISTS "Users can upload files to client folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can view client files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update client files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete client files" ON storage.objects;

-- Create new policy that allows uploads to agent folders
CREATE POLICY "Users can upload files to agent folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE id = (storage.foldername(name))[1]::uuid
    AND email = auth.jwt() ->> 'email'
  )
);

-- Update existing policies to use the same agent folder check
CREATE POLICY "Users can view agent files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE id = (storage.foldername(name))[1]::uuid
    AND email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Users can update agent files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE id = (storage.foldername(name))[1]::uuid
    AND email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE id = (storage.foldername(name))[1]::uuid
    AND email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Users can delete agent files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE id = (storage.foldername(name))[1]::uuid
    AND email = auth.jwt() ->> 'email'
  )
); 