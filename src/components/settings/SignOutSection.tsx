
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useClientActivity } from '@/hooks/useClientActivity';
import { useToast } from '@/components/ui/use-toast';

export function SignOutSection() {
  const { signOut, user } = useAuth();
  const { logClientActivity } = useClientActivity(user?.id);
  const { toast } = useToast();

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
      
      toast({
        title: 'Signed out successfully',
        description: 'You have been signed out of your account.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error signing out',
        description: 'There was a problem signing out. Please try again.',
        variant: 'destructive',
      });
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
