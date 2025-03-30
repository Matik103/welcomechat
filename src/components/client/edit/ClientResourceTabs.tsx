
import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { Client } from '@/types/client';

interface ClientResourceTabsProps {
  client: Client | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refetchClient: () => Promise<any>;
  logClientActivity: () => Promise<void>;
}

export const ClientResourceTabs: React.FC<ClientResourceTabsProps> = ({
  client,
  activeTab,
  setActiveTab,
  refetchClient,
  logClientActivity
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="profile">Profile Information</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-6">
        <div className="flex justify-end mt-4">
          <Button 
            type="button" 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            onClick={() => setActiveTab('resources')}
          >
            Next: Resources <ChevronRight className="h-4 w-4" />
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
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};
