-- Drop existing upload policy
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;

-- Create new policy that allows uploads to client folders
CREATE POLICY "Users can upload files to client folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE id = (storage.foldername(name))[1]::uuid
    AND (
      -- Allow if the user owns the client
      user_id = auth.uid() OR
      -- Or if the user is a team member with access
      EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
        AND client_id = (storage.foldername(name))[1]::uuid
      )
    )
  )
);

-- Update existing policies to use the same client folder check
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
CREATE POLICY "Users can view client files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE id = (storage.foldername(name))[1]::uuid
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
        AND client_id = (storage.foldername(name))[1]::uuid
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update client files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE id = (storage.foldername(name))[1]::uuid
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
        AND client_id = (storage.foldername(name))[1]::uuid
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE id = (storage.foldername(name))[1]::uuid
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
        AND client_id = (storage.foldername(name))[1]::uuid
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete client files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-storage' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE id = (storage.foldername(name))[1]::uuid
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid()
        AND client_id = (storage.foldername(name))[1]::uuid
      )
    )
  )
); 