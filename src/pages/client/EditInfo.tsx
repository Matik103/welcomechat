
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
import { supabase } from "@/integrations/supabase/client";

const EditInfo = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [loadingClientId, setLoadingClientId] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load client ID from user metadata or directly from the database
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        setLoadingClientId(true);
        
        // First try to get from user metadata
        if (user?.user_metadata?.client_id) {
          console.log("Setting client ID from user metadata:", user.user_metadata.client_id);
          setClientId(user.user_metadata.client_id);
          setLoadingClientId(false);
          return;
        }
        
        // If not in metadata, query the clients table for a match on email
        if (user?.email) {
          console.log("Looking up client ID by email:", user.email);
          const { data, error } = await supabase
            .from("clients")
            .select("id")
            .eq("email", user.email)
            .single();
            
          if (error) {
            console.error("Error finding client by email:", error);
            setError("Could not find your client account. Please contact support.");
          } else if (data?.id) {
            console.log("Found client ID from database:", data.id);
            setClientId(data.id);
          } else {
            setError("No client account found for your email address.");
          }
        } else {
          setError("User email not available. Please try logging out and in again.");
        }
      } catch (err) {
        console.error("Error in fetchClientId:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoadingClientId(false);
      }
    };
    
    fetchClientId();
  }, [user]);
  
  // Use client data hooks only after clientId is available
  const { 
    client, 
    isLoadingClient,
    error: clientError 
  } = useClientData(clientId);
  
  const { logClientActivity } = useClientActivity(clientId);
  
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
  console.log("EditInfo: client ID:", clientId);
  console.log("EditInfo: client data:", client);
  console.log("EditInfo: website URLs:", websiteUrls);
  console.log("EditInfo: drive links:", driveLinks);

  if (loadingClientId || isLoadingClient || isUrlsLoading || isDriveLinksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || clientError) {
    return <ErrorDisplay message={error || clientError?.message || "An error occurred"} />;
  }

  if (!clientId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Client Account Not Found</h2>
          <p>We couldn't identify your client account. Please contact support for assistance.</p>
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
