
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ErrorDisplay from "@/components/client/ErrorDisplay";
import EditInfoHeader from "@/components/client/EditInfoHeader";
import ClientInfoSection from "@/components/client/ClientInfoSection";
import WebsiteUrlsSection from "@/components/client/WebsiteUrlsSection";
import DriveLinksSection from "@/components/client/DriveLinksSection";

const EditInfo = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  
  // Set client ID from user metadata when available
  useEffect(() => {
    if (user?.user_metadata?.client_id) {
      console.log("Setting client ID from user metadata:", user.user_metadata.client_id);
      setClientId(user.user_metadata.client_id);
    } else {
      console.log("No client ID found in user metadata, trying to continue anyway");
    }
  }, [user]);
  
  // Use the enhanced useClientData hook to handle client data regardless of client ID
  const { client, isLoadingClient, error } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  // Website URL and Drive Link hooks - these will handle empty client IDs gracefully
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

  console.log("EditInfo: user email:", user?.email);
  console.log("EditInfo: client data:", client);
  console.log("EditInfo: website URLs:", websiteUrls);
  console.log("EditInfo: drive links:", driveLinks);

  if (isLoadingClient || isUrlsLoading || isDriveLinksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
          isClientView={true}
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
