
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
import { checkAndRefreshAuth } from "@/services/authService";

const EditInfo = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshingAuth, setIsRefreshingAuth] = useState(true);
  
  // First refresh auth to ensure we have valid tokens
  useEffect(() => {
    const refreshAuth = async () => {
      try {
        const isAuthValid = await checkAndRefreshAuth();
        if (!isAuthValid) {
          console.error("Auth validation failed");
          setError("Your session has expired. Please log in again.");
        }
      } catch (err) {
        console.error("Error refreshing auth:", err);
      } finally {
        setIsRefreshingAuth(false);
      }
    };
    
    refreshAuth();
  }, []);
  
  // Load client ID only once during initial component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchClientId = async () => {
      try {
        // First try to get from user metadata
        if (user?.user_metadata?.client_id) {
          console.log("Setting client ID from user metadata:", user.user_metadata.client_id);
          if (isMounted) {
            setClientId(user.user_metadata.client_id);
            setInitialLoadComplete(true);
          }
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
            if (isMounted) {
              setError("Could not find your client account. Please contact support.");
              setInitialLoadComplete(true);
            }
          } else if (data?.id) {
            console.log("Found client ID from database:", data.id);
            
            // Update user metadata with the client ID for future use
            try {
              await supabase.auth.updateUser({
                data: { client_id: data.id }
              });
              console.log("Updated user metadata with client_id:", data.id);
            } catch (updateErr) {
              console.error("Error updating user metadata:", updateErr);
            }
            
            if (isMounted) {
              setClientId(data.id);
              setInitialLoadComplete(true);
            }
          } else {
            if (isMounted) {
              setError("No client account found for your email address.");
              setInitialLoadComplete(true);
            }
          }
        } else {
          if (isMounted) {
            setError("User email not available. Please try logging out and in again.");
            setInitialLoadComplete(true);
          }
        }
      } catch (err) {
        console.error("Error in fetchClientId:", err);
        if (isMounted) {
          setError("An unexpected error occurred. Please try again later.");
          setInitialLoadComplete(true);
        }
      }
    };
    
    if (user && !isRefreshingAuth) {
      fetchClientId();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, isRefreshingAuth]);
  
  // Only use client data hooks after clientId is available and stable
  const { 
    client, 
    isLoadingClient,
    error: clientError,
    isResolvingId,
    clientId: resolvedClientId
  } = useClientData(clientId);
  
  const effectiveClientId = clientId || resolvedClientId;
  
  const { logClientActivity } = useClientActivity(effectiveClientId);
  
  const { 
    websiteUrls, 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation, 
    isLoading: isUrlsLoading 
  } = useWebsiteUrls(effectiveClientId);

  const { 
    driveLinks, 
    addDriveLinkMutation, 
    deleteDriveLinkMutation, 
    isLoading: isDriveLinksLoading 
  } = useDriveLinks(effectiveClientId);

  console.log("EditInfo: user email:", user?.email);
  console.log("EditInfo: client ID:", effectiveClientId);
  console.log("EditInfo: client data:", client);
  console.log("EditInfo: website URLs:", websiteUrls);
  console.log("EditInfo: drive links:", driveLinks);

  // New centralized loading state
  const isLoading = !initialLoadComplete || isLoadingClient || isUrlsLoading || isDriveLinksLoading || isResolvingId || isRefreshingAuth;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-gray-500">Loading client information...</p>
        </div>
      </div>
    );
  }

  if (error || clientError) {
    return <ErrorDisplay message={error || clientError?.message || "An error occurred"} />;
  }

  if (!effectiveClientId) {
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
          clientId={effectiveClientId} 
          logClientActivity={logClientActivity}
          isClientView={true}
        />

        <WebsiteUrlsSection
          clientId={effectiveClientId}
          websiteUrls={websiteUrls || []}
          addWebsiteUrlMutation={addWebsiteUrlMutation}
          deleteWebsiteUrlMutation={deleteWebsiteUrlMutation}
          logClientActivity={logClientActivity}
        />

        <DriveLinksSection
          clientId={effectiveClientId}
          driveLinks={driveLinks || []}
          addDriveLinkMutation={addDriveLinkMutation}
          deleteDriveLinkMutation={deleteDriveLinkMutation}
          logClientActivity={logClientActivity}
        />
      </div>
    </div>
  );
};

export default EditInfo;
