-- Create document storage table
CREATE TABLE IF NOT EXISTS public.document_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_storage_client_id ON public.document_storage(client_id);
CREATE INDEX IF NOT EXISTS idx_document_storage_created_by ON public.document_storage(created_by);

-- Enable RLS
ALTER TABLE public.document_storage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their client documents" ON public.document_storage;
DROP POLICY IF EXISTS "Users can insert documents for their clients" ON public.document_storage;
DROP POLICY IF EXISTS "Users can update their client documents" ON public.document_storage;
DROP POLICY IF EXISTS "Users can delete their client documents" ON public.document_storage;
DROP POLICY IF EXISTS "Service role has full access" ON public.document_storage;

-- Create policies
CREATE POLICY "Users can view their client documents"
ON public.document_storage
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert documents for their clients"
ON public.document_storage
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their client documents"
ON public.document_storage
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete their client documents"
ON public.document_storage
FOR DELETE
TO authenticated
USING (true);

-- Create service role policy
CREATE POLICY "Service role has full access"
ON public.document_storage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.document_storage TO authenticated;
GRANT ALL ON public.document_storage TO service_role;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_document_storage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_storage_updated_at
  BEFORE UPDATE ON public.document_storage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_storage_updated_at();

-- Create function to get documents for a client
CREATE OR REPLACE FUNCTION public.get_client_documents(p_client_id UUID)
RETURNS SETOF public.document_storage
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.document_storage
  WHERE client_id = p_client_id
  ORDER BY created_at DESC;
END;
$$; 