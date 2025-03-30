
import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { Client } from '@/types/client';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityType, ActivityTypeString } from '@/types/activity';

interface ClientResourceTabsProps {
  client: Client | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refetchClient: () => Promise<any>;
  logClientActivity: (type: ActivityType | ActivityTypeString, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const ClientResourceTabs: React.FC<ClientResourceTabsProps> = ({
  client,
  activeTab,
  setActiveTab,
  refetchClient,
  logClientActivity
}) => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="profile">
          {isAdmin ? 'Profile Information' : 'Your Profile'}
        </TabsTrigger>
        <TabsTrigger value="resources">
          {isAdmin ? 'Resources' : 'Your Resources'}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-6">
        <div className="flex justify-end mt-4">
          <Button 
            type="button" 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            onClick={() => setActiveTab('resources')}
          >
            Next: {isAdmin ? 'Resources' : 'Your Resources'} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="resources">
        {client && (
          <ClientResourceSections 
            clientId={client.id || client.client_id}
            logClientActivity={logClientActivity}
            onResourceChange={refetchClient}
          />
        )}
        
        <div className="flex justify-start mt-4">
          <Button 
            type="button" 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setActiveTab('profile')}
          >
            <ArrowLeft className="h-4 w-4" /> Back to {isAdmin ? 'Profile' : 'Your Profile'}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};
