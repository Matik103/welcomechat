-- Create the client_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    token UUID NOT NULL,
    email TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_invitations_client_id ON client_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_status ON client_invitations(status);

-- Add RLS policies
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all records
CREATE POLICY "service_role_manage_all"
ON client_invitations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 