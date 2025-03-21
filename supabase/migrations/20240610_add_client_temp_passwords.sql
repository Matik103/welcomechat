
-- Create table for storing client temporary passwords
CREATE TABLE IF NOT EXISTS public.client_temp_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  email TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_agent FOREIGN KEY (agent_id) REFERENCES public.ai_agents(id) ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS client_temp_passwords_agent_id_idx ON public.client_temp_passwords(agent_id);
CREATE INDEX IF NOT EXISTS client_temp_passwords_email_idx ON public.client_temp_passwords(email);

-- Enable Row Level Security
ALTER TABLE public.client_temp_passwords ENABLE ROW LEVEL SECURITY;

-- Add policy for service role access
CREATE POLICY "Service role can manage temp passwords"
  ON public.client_temp_passwords
  USING (true)
  WITH CHECK (true);

-- Add policy for admins to view passwords but not modify
CREATE POLICY "Admins can view temp passwords"
  ON public.client_temp_passwords
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));
