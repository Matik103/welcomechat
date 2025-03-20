
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

interface ClientResourceSectionsProps {
  clientId: string;
  clientName?: string;
  agentName?: string;
  className?: string;
}

export const ClientResourceSections = ({ 
  clientId, 
  clientName, 
  agentName = "Agent", 
  className 
}: ClientResourceSectionsProps) => {
  const { logClientActivity } = useClientActivity(clientId);
  const [activeTab, setActiveTab] = useState('documents');
  
  // Fetch drive links and website URLs
  const {
    driveLinks,
    isLoading,
    error,
    refetch,
    addDriveLink,
    deleteDriveLink,
    isAdding,
    isDeleting
  } = useDriveLinks(clientId);

  const {
    websiteUrls,
    isLoading: isLoadingUrls,
    error: urlsError,
    refetch: refetchUrls,
    addWebsiteUrl,
    deleteWebsiteUrl,
    isAdding: isAddingUrl,
    isDeleting: isDeletingUrl
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
              onAdd={(data) => addDriveLink(data)}
              onDelete={(linkId) => deleteDriveLink(linkId)}
              isLoading={isLoading}
              isAdding={isAdding}
              isDeleting={isDeleting}
              agentName={agentNameState}
            />
          </DocumentResourcesSection>
        </TabsContent>
        
        <TabsContent value="websites">
          <WebsiteResourcesSection
            clientId={clientId}
            logActivity={logClientActivity}
          >
            <WebsiteUrls
              websiteUrls={websiteUrls}
              onAdd={(data) => addWebsiteUrl(data)}
              onDelete={(urlId) => deleteWebsiteUrl(urlId)}
              isLoading={isLoadingUrls}
              isAdding={isAddingUrl}
              isDeleting={isDeletingUrl}
              agentName={agentNameState}
            />
          </WebsiteResourcesSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};
