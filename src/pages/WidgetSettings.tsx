
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientActivity } from "@/hooks/useClientActivity";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";

const WidgetSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  // Determine if this is a client view or admin view
  const isClientView = userRole === 'client';
  
  // Get the appropriate client ID
  const clientId = id || (isClientView ? user?.user_metadata?.client_id : undefined);
  
  console.log("WidgetSettings: Using client ID:", clientId);
  console.log("WidgetSettings: User role:", userRole);
  console.log("WidgetSettings: Is client view:", isClientView);
  
  const { logClientActivity } = useClientActivity(clientId);

  const { 
    settings, 
    isLoading, 
    isUploading, 
    updateSettingsMutation,
    handleLogoUpload 
  } = useWidgetSettings(clientId, isClientView);

  const handleBack = () => {
    if (isClientView) {
      navigate('/client/dashboard');
    } else if (id) {
      // Admin is viewing a specific client's widget settings
      navigate(`/admin/clients/${id}`);
    } else {
      navigate('/admin/clients');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Client not found</h1>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <WidgetSettingsContainer
      clientId={clientId}
      settings={settings}
      isClientView={isClientView}
      isUploading={isUploading}
      updateSettingsMutation={updateSettingsMutation}
      handleBack={handleBack}
      handleLogoUpload={handleLogoUpload}
      logClientActivity={logClientActivity}
    />
  );
};

export default WidgetSettings;
