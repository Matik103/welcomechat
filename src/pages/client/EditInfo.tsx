
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Database, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { DriveLinks } from "@/components/client/DriveLinks";
import { toast } from "sonner";
import { ClientForm } from "@/components/client/ClientForm";
import { getCurrentUser } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

const EditInfo = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [isLoadingId, setIsLoadingId] = useState(true);
  
  // Load user metadata directly from Supabase to ensure we have the latest data
  useEffect(() => {
    const fetchClientId = async () => {
      setIsLoadingId(true);
      try {
        // Check if client_id is in user metadata
        if (user?.user_metadata?.client_id) {
          console.log("Found client ID in user metadata:", user.user_metadata.client_id);
          setClientId(user.user_metadata.client_id);
        } else {
          // If not in metadata, query user_roles table
          console.log("No client ID in user metadata, checking user_roles table");
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('client_id')
            .eq('user_id', user?.id)
            .eq('role', 'client')
            .maybeSingle();
          
          if (roleError) {
            console.error("Error fetching client role:", roleError);
            throw roleError;
          }
          
          if (roleData?.client_id) {
            console.log("Found client ID in user_roles:", roleData.client_id);
            setClientId(roleData.client_id);
            
            // Update user metadata for future use
            await supabase.auth.updateUser({
              data: { client_id: roleData.client_id }
            });
          } else {
            console.error("No client ID found in user_roles");
            toast.error("No client ID found. Please contact support.");
          }
        }
      } catch (error) {
        console.error("Error fetching client ID:", error);
        toast.error("Error fetching client information. Please try again.");
      } finally {
        setIsLoadingId(false);
      }
    };
    
    if (user) {
      fetchClientId();
    } else {
      setIsLoadingId(false);
    }
  }, [user]);
  
  const { client, isLoadingClient, error, clientMutation } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  console.log("EditInfo: client ID from auth:", clientId);
  
  const { 
    websiteUrls, 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation, 
    isLoading: isUrlsLoading,
    refetchWebsiteUrls
  } = useWebsiteUrls(clientId);

  const { 
    driveLinks, 
    addDriveLinkMutation, 
    deleteDriveLinkMutation, 
    isLoading: isDriveLinksLoading,
    refetchDriveLinks
  } = useDriveLinks(clientId);

  console.log("Website URLs:", websiteUrls);
  console.log("Drive Links:", driveLinks);

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    try {
      if (!clientId) {
        toast.error("Client ID is missing. Please try refreshing the page.");
        return;
      }
      
      await clientMutation.mutateAsync(data);
      
      if (clientId) {
        try {
          await logClientActivity(
            "client_updated", 
            "updated their client information",
            { 
              updated_fields: Object.keys(data).filter(key => 
                client && data[key as keyof typeof data] !== client[key as keyof typeof client]
              )
            }
          );
        } catch (logError) {
          console.error("Error logging activity:", logError);
          // Continue even if logging fails
        }
      }
      
      toast.success("Client information saved successfully");
    } catch (error) {
      console.error("Error submitting client form:", error);
      toast.error("Failed to save client information");
    }
  };

  const handleAddUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      if (!clientId) {
        toast.error("Client ID is missing. Please try refreshing the page.");
        return;
      }
      
      await addWebsiteUrlMutation.mutateAsync(data);
      
      // Explicitly refetch to ensure UI is updated
      await refetchWebsiteUrls();
      
      if (clientId) {
        await logClientActivity(
          "website_url_added", 
          "added a website URL", 
          { url: data.url }
        );
      }
    } catch (error) {
      console.error("Error adding URL:", error);
      throw error;
    }
  };

  const handleDeleteUrl = async (id: number) => {
    try {
      if (!clientId) {
        toast.error("Client ID is missing. Please try refreshing the page.");
        return;
      }
      
      const urlToDelete = websiteUrls.find(url => url.id === id);
      await deleteWebsiteUrlMutation.mutateAsync(id);
      
      // Explicitly refetch to ensure UI is updated
      await refetchWebsiteUrls();
      
      if (clientId && urlToDelete) {
        await logClientActivity(
          "url_deleted", 
          "removed a website URL", 
          { url: urlToDelete.url }
        );
      }
    } catch (error) {
      console.error("Error deleting URL:", error);
      throw error;
    }
  };

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    try {
      if (!clientId) {
        toast.error("Client ID is missing. Please try refreshing the page.");
        return;
      }
      
      await addDriveLinkMutation.mutateAsync(data);
      
      // Explicitly refetch to ensure UI is updated
      await refetchDriveLinks();
      
      if (clientId) {
        await logClientActivity(
          "drive_link_added", 
          "added a Google Drive link", 
          { link: data.link }
        );
      }
    } catch (error) {
      console.error("Error adding drive link:", error);
      throw error;
    }
  };

  const handleDeleteDriveLink = async (id: number) => {
    try {
      if (!clientId) {
        toast.error("Client ID is missing. Please try refreshing the page.");
        return;
      }
      
      const linkToDelete = driveLinks.find(link => link.id === id);
      await deleteDriveLinkMutation.mutateAsync(id);
      
      // Explicitly refetch to ensure UI is updated
      await refetchDriveLinks();
      
      if (clientId && linkToDelete) {
        await logClientActivity(
          "drive_link_deleted", 
          "removed a Google Drive link", 
          { link: linkToDelete.link }
        );
      }
    } catch (error) {
      console.error("Error deleting drive link:", error);
      throw error;
    }
  };

  if (isLoadingId || isLoadingClient || isUrlsLoading || isDriveLinksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-700">Unable to find your client ID. Please contact support or try signing out and signing back in.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 mr-2"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-700">Error loading client data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/client/view"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Information</h1>
          <p className="text-gray-500">Update client information</p>
        </div>
      </div>
      
      <div className="space-y-8">
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm 
              initialData={client}
              onSubmit={handleSubmit}
              isLoading={clientMutation.isPending}
              isClientView={true}
            />
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Website URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <WebsiteUrls
              urls={websiteUrls}
              onAdd={handleAddUrl}
              onDelete={handleDeleteUrl}
              isAddLoading={addWebsiteUrlMutation.isPending}
              isDeleteLoading={deleteWebsiteUrlMutation.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Google Drive Links</CardTitle>
          </CardHeader>
          <CardContent>
            <DriveLinks
              driveLinks={driveLinks}
              onAdd={handleAddDriveLink}
              onDelete={handleDeleteDriveLink}
              isAddLoading={addDriveLinkMutation.isPending}
              isDeleteLoading={deleteDriveLinkMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditInfo;
