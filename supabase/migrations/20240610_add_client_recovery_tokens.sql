
-- Create client_recovery_tokens table for tracking recovery links
CREATE TABLE IF NOT EXISTS public.client_recovery_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT token_not_empty CHECK (token <> '')
);

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS client_recovery_tokens_token_idx ON public.client_recovery_tokens(token);

-- Add RLS policies
ALTER TABLE public.client_recovery_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" 
  ON public.client_recovery_tokens 
  USING (true) 
  WITH CHECK (true);

