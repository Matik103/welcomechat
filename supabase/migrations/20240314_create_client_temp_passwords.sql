-- Create the client_temp_passwords table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_temp_passwords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    email TEXT NOT NULL,
    temp_password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_temp_passwords_client_id ON client_temp_passwords(client_id);
CREATE INDEX IF NOT EXISTS idx_client_temp_passwords_email ON client_temp_passwords(email);

-- Add RLS policies
ALTER TABLE client_temp_passwords ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all records
CREATE POLICY "service_role_manage_all"
ON client_temp_passwords
FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 