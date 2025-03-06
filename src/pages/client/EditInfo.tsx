
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ClientIdMissingAlert from "@/components/client/ClientIdMissingAlert";
import ErrorDisplay from "@/components/client/ErrorDisplay";
import EditInfoHeader from "@/components/client/EditInfoHeader";
import ClientInfoSection from "@/components/client/ClientInfoSection";
import WebsiteUrlsSection from "@/components/client/WebsiteUrlsSection";
import DriveLinksSection from "@/components/client/DriveLinksSection";

const EditInfo = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Set client ID from user metadata when available
  useEffect(() => {
    if (user?.user_metadata?.client_id) {
      console.log("Setting client ID from user metadata:", user.user_metadata.client_id);
      setClientId(user.user_metadata.client_id);
    } else {
      console.warn("No client ID found in user metadata");
    }
    setIsInitialized(true);
    console.log("Client data initialized");
  }, [user]);
  
  const { client, isLoadingClient, error, clientId: resolvedClientId } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  // Website URL and Drive Link hooks
  const { 
    websiteUrls, 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation, 
    isLoading: isUrlsLoading 
  } = useWebsiteUrls(clientId);

  const { 
    driveLinks, 
    addDriveLinkMutation, 
    deleteDriveLinkMutation, 
    isLoading: isDriveLinksLoading 
  } = useDriveLinks(clientId);

  console.log("EditInfo: client ID from auth:", clientId);
  console.log("EditInfo: resolved client ID:", resolvedClientId);
  console.log("Website URLs:", websiteUrls);
  console.log("Drive Links:", driveLinks);

  // Handle adding a website URL
  const handleAddUrl = async (data: { url: string; refresh_rate: number }) => {
    if (!clientId) {
      toast.error("Client ID is missing. Please try refreshing the page.");
      return;
    }
    
    try {
      await addWebsiteUrlMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error in handleAddUrl:", error);
    }
  };

  if (isLoadingClient || isUrlsLoading || isDriveLinksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle case when initialized but no client ID is found
  if (isInitialized && !clientId) {
    return <ClientIdMissingAlert />;
  }

  if (error) {
    return <ErrorDisplay message={error.message} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <EditInfoHeader />
      
      <div className="space-y-8">
        <ClientInfoSection 
          client={client} 
          clientId={clientId} 
          logClientActivity={logClientActivity}
        />

        <WebsiteUrlsSection
          clientId={clientId}
          websiteUrls={websiteUrls}
          addWebsiteUrlMutation={addWebsiteUrlMutation}
          deleteWebsiteUrlMutation={deleteWebsiteUrlMutation}
          logClientActivity={logClientActivity}
        />

        <DriveLinksSection
          clientId={clientId}
          driveLinks={driveLinks}
          addDriveLinkMutation={addDriveLinkMutation}
          deleteDriveLinkMutation={deleteDriveLinkMutation}
          logClientActivity={logClientActivity}
        />
      </div>
    </div>
  );
};

export default EditInfo;
