
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useClientData } from "@/hooks/useClientData";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { ClientForm } from "@/components/client/ClientForm";
import { DriveLinks } from "@/components/client/DriveLinks";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";

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

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    try {
      await clientMutation.mutateAsync(data);
      if (isClientView) {
        navigate("/client/view");
      } else {
        navigate("/admin/clients");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      // Error is already handled in the mutation's onError callback
    }
  };

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    await addDriveLinkMutation.mutateAsync(data);
  };

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    await addWebsiteUrlMutation.mutateAsync(data);
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
                ? "Account Settings" 
                : id 
                  ? `Edit Client - ${client?.client_name}` 
                  : "Add New Client"}
            </h1>
            <p className="text-gray-500">
              {isClientView 
                ? "Manage your account information" 
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
                  onDelete={deleteDriveLinkMutation.mutate}
                  isAddLoading={addDriveLinkMutation.isPending}
                  isDeleteLoading={deleteDriveLinkMutation.isPending}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Website URLs</h2>
                <WebsiteUrls
                  urls={websiteUrls}
                  onAdd={handleAddWebsiteUrl}
                  onDelete={deleteWebsiteUrlMutation.mutate}
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
