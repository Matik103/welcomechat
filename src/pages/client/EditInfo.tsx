
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
      console.warn("No client ID found in user metadata");
      toast.error("No client ID found. Please refresh the page or contact support.");
    }
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
    try {
      if (!clientId) {
        toast.error("Client ID is required to add a URL");
        return;
      }
      
      console.log("Adding website URL:", data);
      await addWebsiteUrlMutation.mutateAsync(data);
      toast.success("Website URL added successfully");
    } catch (error) {
      console.error("Error in handleAddUrl:", error);
      toast.error("Failed to add website URL");
    }
  };

  // Handle adding a drive link
  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    try {
      if (!clientId) {
        toast.error("Client ID is required to add a drive link");
        return;
      }
      
      console.log("Adding drive link:", data);
      await addDriveLinkMutation.mutateAsync(data);
      toast.success("Drive link added successfully");
    } catch (error) {
      console.error("Error in handleAddDriveLink:", error);
      toast.error("Failed to add drive link");
    }
  };

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

  if (!clientId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-100">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Client ID Not Found</h2>
          <p className="text-red-700 mb-4">
            Unable to load your client information. Please refresh the page or contact support.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
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
