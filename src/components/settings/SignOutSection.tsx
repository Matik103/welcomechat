
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useClientActivity } from '@/hooks/useClientActivity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const SignOutSection = ({ clientId }: { clientId?: string }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { logActivity } = useClientActivity(clientId);

  const handleSignOut = async () => {
    try {
      // Log the sign out activity if clientId is provided
      if (clientId) {
        await logActivity.mutateAsync({
          activity_type: 'signed_out',
          description: 'User signed out of the platform',
          metadata: { timestamp: new Date().toISOString() }
        });
      }
      
      // Sign out and redirect
      await signOut();
      toast.success('You have been signed out successfully');
      
      // Navigate to the homepage after sign out
      navigate('/');
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Out</CardTitle>
        <CardDescription>
          Sign out of your account to end your session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          When you sign out, your current session will be terminated. You'll need to sign in again to access your account.
        </p>
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-between pt-6">
        <Button variant="destructive" onClick={handleSignOut}>
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
};
