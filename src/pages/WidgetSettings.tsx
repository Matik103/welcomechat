
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientActivity } from "@/hooks/useClientActivity";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import { WidgetPosition } from "@/types/widget-settings";

const WidgetSettings = () => {
  // Changed from id to clientId to match App.tsx route param name
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  // Determine if this is a client view or admin view
  const isClientView = userRole === 'client';
  
  // Fix for malformed URL with double slash (/admin/clients//widget-settings)
  // This means clientId will be an empty string "" instead of undefined
  // Get the appropriate client ID (clientId may be empty string or undefined)
  const activeClientId = (clientId && clientId !== "") 
    ? clientId 
    : (isClientView ? user?.user_metadata?.client_id : undefined);
  
  console.log("WidgetSettings: Using client ID:", activeClientId);
  console.log("WidgetSettings: User role:", userRole);
  console.log("WidgetSettings: Is client view:", isClientView);
  console.log("WidgetSettings: URL clientId param:", clientId);
  
  const { logClientActivity } = useClientActivity(activeClientId);

  const { 
    settings, 
    isLoading, 
    isUploading, 
    updateSettingsMutation,
    handleLogoUpload: originalHandleLogoUpload 
  } = useWidgetSettings(activeClientId, isClientView);

  // Adapter for the logo upload handler to match the expected type
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      await originalHandleLogoUpload(event.target.files[0]);
    }
  };

  // Adapter for the update settings mutation to match the expected type
  const adaptedUpdateMutation = {
    isPending: updateSettingsMutation.isPending,
    mutateAsync: async (newSettings: typeof settings) => {
      await updateSettingsMutation.mutateAsync(newSettings);
    }
  };

  const handleBack = () => {
    if (isClientView) {
      navigate('/client/dashboard');
    } else if (clientId && clientId !== "") {
      // Admin is viewing a specific client's widget settings
      navigate(`/admin/clients/${clientId}`);
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

  if (!activeClientId) {
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

  // Ensure settings has all required properties and correct types
  const completeSettings = {
    ...settings,
    // Ensure position is a valid WidgetPosition
    position: (settings.position as WidgetPosition) || 'bottom-right'
  };

  return (
    <WidgetSettingsContainer
      clientId={activeClientId}
      settings={completeSettings}
      isClientView={isClientView}
      isUploading={isUploading}
      updateSettingsMutation={adaptedUpdateMutation}
      handleBack={handleBack}
      handleLogoUpload={handleLogoUpload}
      logClientActivity={logClientActivity}
    />
  );
};

export default WidgetSettings;
