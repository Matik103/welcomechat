-- Add assistant_id column to assistant_documents table
ALTER TABLE public.assistant_documents ADD COLUMN IF NOT EXISTS assistant_id TEXT;

-- Create index on assistant_id
CREATE INDEX IF NOT EXISTS idx_assistant_documents_assistant_id ON public.assistant_documents(assistant_id);

-- Update policies to use the new column
DROP POLICY IF EXISTS "Assistants can view their documents" ON public.assistant_documents;
CREATE POLICY "Assistants can view their documents"
ON public.assistant_documents FOR SELECT
USING (assistant_id = auth.uid()::TEXT); 