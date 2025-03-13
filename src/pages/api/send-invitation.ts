import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, clientName } = req.body;

  if (!email || !clientName) {
    return res.status(400).json({ message: 'Email and client name are required' });
  }

  try {
    // Generate a unique invitation token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Store the invitation in the database
    const { error: dbError } = await supabase
      .from('client_invitations')
      .insert({
        email,
        client_name: clientName,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      });

    if (dbError) throw dbError;

    // Send the invitation email
    const { error: emailError } = await supabase.auth.api.inviteUserByEmail(email, {
      data: {
        invitation_token: token,
        client_name: clientName,
      },
    });

    if (emailError) throw emailError;

    return res.status(200).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return res.status(500).json({ message: 'Failed to send invitation' });
  }
} 