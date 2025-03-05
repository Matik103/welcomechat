
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useClientData } from "@/hooks/useClientData";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { ClientForm } from "@/components/client/ClientForm";
import { DriveLinks } from "@/components/client/DriveLinks";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AddEditClientProps {
  isClientView?: boolean;
}

const AddEditClient = ({ isClientView = false }: AddEditClientProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // If in client view, use the client ID from user metadata
  const clientId = isClientView ? user?.user_metadata?.client_id : id;
  
  const { client, isLoadingClient, clientMutation } = useClientData(clientId);
  const { driveLinks, addDriveLinkMutation, deleteDriveLinkMutation } = useDriveLinks(clientId);
  const { websiteUrls, addWebsiteUrlMutation, deleteWebsiteUrlMutation } = useWebsiteUrls(clientId);

  const logClientActivity = async (activity_type: string, description: string, metadata = {}) => {
    if (!clientId) return;
    
    try {
      await supabase.from("client_activities").insert({
        client_id: clientId,
        activity_type,
        description,
        metadata
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    await clientMutation.mutateAsync(data);
    
    // Log client information update activity
    if (isClientView) {
      await logClientActivity(
        "client_updated", 
        "updated their client information",
        { 
          updated_fields: Object.keys(data).filter(key => 
            client && data[key as keyof typeof data] !== client[key as keyof typeof client]
          )
        }
      );
    }
    
    if (isClientView) {
      navigate("/client/view");
    } else {
      navigate("/admin/clients");
    }
  };

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    await addDriveLinkMutation.mutateAsync(data);
    
    // Log drive link addition activity
    if (isClientView) {
      await logClientActivity(
        "drive_link_added", 
        "added a Google Drive link", 
        { link: data.link, refresh_rate: data.refresh_rate }
      );
    }
  };

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    await addWebsiteUrlMutation.mutateAsync(data);
    
    // Log website URL addition activity
    if (isClientView) {
      await logClientActivity(
        "website_url_added", 
        "added a website URL", 
        { url: data.url, refresh_rate: data.refresh_rate }
      );
    }
  };

  const handleDeleteDriveLink = async (linkId: number) => {
    const linkToDelete = driveLinks.find(link => link.id === linkId);
    await deleteDriveLinkMutation.mutate(linkId);
    
    // Log drive link deletion activity
    if (isClientView && linkToDelete) {
      await logClientActivity(
        "drive_link_removed", 
        "removed a Google Drive link", 
        { link: linkToDelete.link }
      );
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    const urlToDelete = websiteUrls.find(url => url.id === urlId);
    await deleteWebsiteUrlMutation.mutate(urlId);
    
    // Log website URL deletion activity
    if (isClientView && urlToDelete) {
      await logClientActivity(
        "website_url_removed", 
        "removed a website URL", 
        { url: urlToDelete.url }
      );
    }
  };

  const handleBack = () => {
    if (isClientView) {
      navigate("/client/view");
    } else {
      navigate("/admin/clients");
    }
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isClientView 
                ? "Edit Client Information" 
                : id 
                  ? `Edit Client - ${client?.client_name}` 
                  : "Add New Client"}
            </h1>
            <p className="text-gray-500">
              {isClientView 
                ? "Update your client information" 
                : id 
                  ? "Update client information" 
                  : "Create a new client"}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <ClientForm
              initialData={client}
              onSubmit={handleSubmit}
              isLoading={clientMutation.isPending}
              isClientView={isClientView}
            />
          </div>

          {(clientId || isClientView) && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Drive Share Links</h2>
                <DriveLinks
                  driveLinks={driveLinks}
                  onAdd={handleAddDriveLink}
                  onDelete={handleDeleteDriveLink}
                  isAddLoading={addDriveLinkMutation.isPending}
                  isDeleteLoading={deleteDriveLinkMutation.isPending}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Website URLs</h2>
                <WebsiteUrls
                  urls={websiteUrls}
                  onAdd={handleAddWebsiteUrl}
                  onDelete={handleDeleteWebsiteUrl}
                  isAddLoading={addWebsiteUrlMutation.isPending}
                  isDeleteLoading={deleteWebsiteUrlMutation.isPending}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEditClient;
