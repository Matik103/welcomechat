
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useClientData } from "@/hooks/useClientData";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { ClientForm } from "@/components/client/ClientForm";
import { DriveLinks } from "@/components/client/DriveLinks";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";

const AddEditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { client, isLoadingClient, clientMutation } = useClientData(id);
  const { driveLinks, addDriveLinkMutation, deleteDriveLinkMutation } = useDriveLinks(id);
  const { websiteUrls, addWebsiteUrlMutation, deleteWebsiteUrlMutation } = useWebsiteUrls(id);

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    await clientMutation.mutateAsync(data);
    navigate("/clients");
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
          <Link 
            to="/clients"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? `Edit Client - ${client?.client_name}` : "Add New Client"}
            </h1>
            <p className="text-gray-500">
              {id ? "Update client information" : "Create a new client"}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <ClientForm
              initialData={client}
              onSubmit={handleSubmit}
              isLoading={clientMutation.isPending}
            />
          </div>

          {id && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Drive Share Links</h2>
                <DriveLinks
                  driveLinks={driveLinks}
                  onAdd={addDriveLinkMutation.mutateAsync}
                  onDelete={deleteDriveLinkMutation.mutate}
                  isAddLoading={addDriveLinkMutation.isPending}
                  isDeleteLoading={deleteDriveLinkMutation.isPending}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Website URLs</h2>
                <WebsiteUrls
                  urls={websiteUrls}
                  onAdd={addWebsiteUrlMutation.mutateAsync}
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
