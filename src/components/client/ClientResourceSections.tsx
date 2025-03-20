
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDriveLinks } from '@/hooks/useDriveLinks';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { useClientActivity } from '@/hooks/useClientActivity';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DriveLinks } from './DriveLinks';
import { WebsiteUrls } from './WebsiteUrls';
import { DocumentLinks } from './DocumentLinks';
import { agentNameToClassName } from '@/utils/stringUtils';
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/activity';
import { Json } from '@/integrations/supabase/types';

interface ClientResourceSectionsProps {
  clientId: string;
  clientName?: string;
  agentName?: string;
  className?: string;
  isClientView?: boolean;
}

export const ClientResourceSections = ({ 
  clientId, 
  clientName, 
  agentName = "Agent", 
  className,
  isClientView = false
}: ClientResourceSectionsProps) => {
  const { logClientActivity } = useClientActivity(clientId);
  const [activeTab, setActiveTab] = useState('documents');
  
  // Fetch drive links and website URLs
  const {
    driveLinks,
    isLoading: isLoadingDriveLinks,
    isError: isErrorDriveLinks,
    refetchDriveLinks,
    addDriveLinkMutation,
    deleteDriveLinkMutation,
  } = useDriveLinks(clientId);

  const {
    websiteUrls,
    isLoading: isLoadingWebsiteUrls,
    isError: isErrorWebsiteUrls,
    refetchWebsiteUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
  } = useWebsiteUrls(clientId);

  // Fetch agent name if not provided
  const [agentNameState, setAgentNameState] = useState(agentName);

  useEffect(() => {
    async function fetchAgentName() {
      try {
        const { data, error } = await supabase
          .from("ai_agents")
          .select("name")
          .eq("id", clientId)
          .single();

        if (error) {
          console.error("Error fetching agent name:", error);
          return;
        }

        if (data && data.name) {
          setAgentNameState(data.name);
        }
      } catch (err) {
        console.error("Failed to fetch agent name:", err);
      }
    }

    if (!agentName) {
      fetchAgentName();
    }
  }, [clientId, agentName]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number; document_type: string }) => {
    return await addDriveLinkMutation.mutateAsync(data);
  };

  const handleDeleteDriveLink = async (linkId: number) => {
    return await deleteDriveLinkMutation.mutateAsync(linkId);
  };

  const handleAddWebsiteUrl = async (data: any) => {
    return await addWebsiteUrlMutation.mutateAsync(data);
  };

  const handleDeleteWebsiteUrl = async (urlId: any) => {
    return await deleteWebsiteUrlMutation.mutateAsync(urlId);
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents">
          <DocumentResourcesSection
            clientId={clientId}
            logActivity={logClientActivity}
            agentName={agentNameState}
          >
            <DocumentLinks
              driveLinks={driveLinks}
              onAdd={handleAddDriveLink}
              onDelete={handleDeleteDriveLink}
              isLoading={isLoadingDriveLinks}
              isAdding={addDriveLinkMutation.isPending}
              isDeleting={deleteDriveLinkMutation.isPending}
              agentName={agentNameState}
            />
          </DocumentResourcesSection>
        </TabsContent>
        
        <TabsContent value="websites">
          <WebsiteResourcesSection
            clientId={clientId}
            logActivity={logClientActivity}
            agentName={agentNameState}
          >
            <WebsiteUrls
              clientId={clientId}
              onAdd={handleAddWebsiteUrl}
              onDelete={handleDeleteWebsiteUrl}
              isLoading={isLoadingWebsiteUrls}
              isAdding={addWebsiteUrlMutation.isPending}
              isDeleting={deleteWebsiteUrlMutation.isPending}
              agentName={agentNameState}
              logClientActivity={logClientActivity}
            />
          </WebsiteResourcesSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};
