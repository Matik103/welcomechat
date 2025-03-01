
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useClientData } from "@/hooks/useClientData";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { ClientForm } from "@/components/client/ClientForm";
import { DriveLinks } from "@/components/client/DriveLinks";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AddEditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [isClientView, setIsClientView] = useState(false);
  
  const { client, isLoadingClient, clientMutation } = useClientData(id);
  const { driveLinks, addDriveLinkMutation, deleteDriveLinkMutation } = useDriveLinks(id);
  const { websiteUrls, addWebsiteUrlMutation, deleteWebsiteUrlMutation } = useWebsiteUrls(id);

  useEffect(() => {
    // If user is a client and no id is provided, get their own client ID
    const getClientId = async () => {
      if (userRole === 'client' && !id && user?.email) {
        setIsClientView(true);
        const { data, error } = await supabase
          .from("clients")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();
          
        if (!error && data?.id) {
          navigate(`/client/edit?id=${data.id}`, { replace: true });
        }
      }
    };
    
    getClientId();
  }, [userRole, id, user, navigate]);

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    await clientMutation.mutateAsync(data);
    
    // Admin goes to client list, client stays on edit page
    if (userRole === 'admin') {
      navigate("/admin/clients");
    }
  };

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    await addDriveLinkMutation.mutateAsync(data);
  };

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    await addWebsiteUrlMutation.mutateAsync(data);
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const backLink = userRole === 'admin' ? "/admin/clients" : "/client/view";
  const headerText = id 
    ? `Edit ${isClientView ? 'Your Profile' : `Client - ${client?.client_name}`}` 
    : "Add New Client";
  const subText = id 
    ? `${isClientView ? 'Update your information' : 'Update client information'}` 
    : "Create a new client";

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            to={backLink}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {headerText}
            </h1>
            <p className="text-gray-500">
              {subText}
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

          {id && (
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
