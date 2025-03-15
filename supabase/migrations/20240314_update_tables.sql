-- Add status field to client_temp_passwords
ALTER TABLE client_temp_passwords 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add temp_password_id to client_invitations
ALTER TABLE client_invitations 
ADD COLUMN IF NOT EXISTS temp_password_id UUID REFERENCES client_temp_passwords(id);

-- Add index for temp_password lookup
CREATE INDEX IF NOT EXISTS idx_client_temp_passwords_status ON client_temp_passwords(status);
CREATE INDEX IF NOT EXISTS idx_client_invitations_temp_password_id ON client_invitations(temp_password_id); 