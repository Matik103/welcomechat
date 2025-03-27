-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name text NOT NULL,
    email text UNIQUE NOT NULL,
    status text DEFAULT 'active',
    agent_name text,
    widget_settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data"
ON public.clients
FOR ALL
USING (id = auth.uid()::uuid);

CREATE POLICY "Service role can access all client data"
ON public.clients
FOR ALL
TO service_role
USING (true); 