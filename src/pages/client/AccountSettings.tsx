
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, KeyRound, LogOut } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { useClient } from '@/hooks/useClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSection } from '@/components/client/settings/ProfileSection';
import { SecuritySection } from '@/components/client/settings/SecuritySection';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AccountSettings() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  
  const clientId = user?.user_metadata?.client_id;
  const { client, isLoading: isLoadingClient, refetch } = useClient(clientId || '');
  
  useEffect(() => {
    if (!user) {
      // Handle unauthenticated user
      console.log("User not authenticated, redirecting to auth page");
    }
  }, [user, navigation]);

  const handleNavigateBack = () => {
    navigation.goToClientDashboard();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("You have been signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  if (!user) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to access your account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigation.goBack()} 
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="container mx-auto py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 flex items-center gap-1"
          onClick={handleNavigateBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <PageHeading>
          Account Settings
          <p className="text-sm font-normal text-muted-foreground">
            Manage your profile, security, and account preferences
          </p>
        </PageHeading>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <ProfileSection 
                client={client}
                user={user}
                isLoading={isLoadingClient}
                onProfileUpdated={refetch}
              />
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6">
              <SecuritySection />
              
              <Separator className="my-6" />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </CardTitle>
                  <CardDescription>
                    Sign out from your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ClientLayout>
  );
}
