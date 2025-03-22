
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useClientActivity } from '@/hooks/useClientActivity';
import { toast } from 'sonner';

export function SignOutSection() {
  const { signOut, user } = useAuth();
  const { logClientActivity } = useClientActivity(user?.id);

  const handleSignOut = async () => {
    try {
      // Log the sign out activity
      await logClientActivity(
        'signed_out',
        'User signed out',
        { user_id: user?.id }
      );
      
      // Sign out
      await signOut();
      
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('There was a problem signing out. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Out</CardTitle>
        <CardDescription>
          Sign out from your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSignOut} variant="destructive">
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
