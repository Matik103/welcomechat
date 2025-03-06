
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { DriveLinks } from "@/components/client/DriveLinks";
import { toast } from "sonner";
import { ClientForm } from "@/components/client/ClientForm";

const EditInfo = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const { client, isLoadingClient, error, clientMutation } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  useEffect(() => {
    if (user?.user_metadata?.client_id) {
      setClientId(user.user_metadata.client_id);
    }
  }, [user]);
  
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
      await addWebsiteUrlMutation.mutateAsync(data);
      
      if (clientId) {
        await logClientActivity(
          "website_url_added", 
          "added a website URL", 
          { url: data.url }
        );
      }
    } catch (error) {
      console.error("Error adding URL:", error);
      throw error; // Re-throw to be caught by the WebsiteUrls component
    }
  };

  const handleDeleteUrl = async (id: number) => {
    try {
      const urlToDelete = websiteUrls.find(url => url.id === id);
      await deleteWebsiteUrlMutation.mutateAsync(id);
      
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
      await addDriveLinkMutation.mutateAsync(data);
      
      if (clientId) {
        await logClientActivity(
          "drive_link_added", 
          "added a Google Drive link", 
          { link: data.link }
        );
      }
    } catch (error) {
      console.error("Error adding drive link:", error);
      throw error; // Re-throw to be caught by the DriveLinks component
    }
  };

  const handleDeleteDriveLink = async (id: number) => {
    try {
      const linkToDelete = driveLinks.find(link => link.id === id);
      await deleteDriveLinkMutation.mutateAsync(id);
      
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

  if (isLoadingClient || isUrlsLoading || isDriveLinksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
