
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DocumentResourcesSection, WebsiteResourcesSection } from "./resource-sections";

interface ClientResourceSectionsProps {
  clientId: string | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const ClientResourceSections = ({ 
  clientId, 
  isClientView,
  logClientActivity 
}: ClientResourceSectionsProps) => {
  if (!clientId) {
    console.error("ClientResourceSections: clientId is undefined");
    return null;
  }

  console.log("ClientResourceSections rendering with clientId:", clientId);

  const { 
    documentLinks,
    addDriveLinkMutation, 
    deleteDriveLinkMutation,
    uploadDocumentMutation,
    isLoading: isDriveLoading 
  } = useDriveLinks(clientId);
  
  const { 
    websiteUrls, 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation, 
    isLoading: isUrlsLoading 
  } = useWebsiteUrls(clientId);

  console.log("Document Links:", documentLinks);
  console.log("Website URLs:", websiteUrls);

  const [agentName, setAgentName] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAgentName = async () => {
      if (!clientId) return;
      
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("agent_name")
          .eq("id", clientId)
          .single();
        
        if (error) {
          console.error("Error fetching agent name:", error);
        } else {
          console.log("Fetched agent name:", data.agent_name);
          setAgentName(data.agent_name);
        }
      } catch (error) {
        console.error("Error in fetchAgentName:", error);
      }
    };
    
    fetchAgentName();
  }, [clientId]);

  if (isDriveLoading || isUrlsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DocumentResourcesSection 
        documentLinks={documentLinks}
        addDriveLinkMutation={addDriveLinkMutation}
        deleteDriveLinkMutation={deleteDriveLinkMutation}
        uploadDocumentMutation={uploadDocumentMutation}
        clientId={clientId}
        agentName={agentName}
        isClientView={isClientView}
        logClientActivity={logClientActivity}
      />

      <WebsiteResourcesSection
        websiteUrls={websiteUrls}
        addWebsiteUrlMutation={addWebsiteUrlMutation}
        deleteWebsiteUrlMutation={deleteWebsiteUrlMutation}
        clientId={clientId}
        agentName={agentName}
        isClientView={isClientView}
        logClientActivity={logClientActivity}
      />
    </div>
  );
};
