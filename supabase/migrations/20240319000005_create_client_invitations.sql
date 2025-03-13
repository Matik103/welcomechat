-- Create client invitations table
CREATE TABLE IF NOT EXISTS client_invitations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text NOT NULL,
  client_name text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  used_at timestamp with time zone,
  used_by uuid REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to manage invitations"
  ON client_invitations
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow users to view their own invitations"
  ON client_invitations
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Create function to validate invitation token
CREATE OR REPLACE FUNCTION validate_invitation_token(token text)
RETURNS json AS $$
DECLARE
  invitation record;
BEGIN
  SELECT * INTO invitation
  FROM client_invitations
  WHERE token = token
  AND expires_at > now()
  AND used_at IS NULL;

  IF invitation IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Invalid or expired invitation token'
    );
  END IF;

  RETURN json_build_object(
    'valid', true,
    'client_name', invitation.client_name,
    'email', invitation.email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 