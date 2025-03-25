
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientActivity } from "@/hooks/useClientActivity";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import { WidgetPosition } from "@/types/widget-settings";
import { useClientData } from "@/hooks/useClientData";

const WidgetSettings = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  // Determine if this is a client view or admin view
  const isClientView = userRole === 'client';
  
  // Get the appropriate client ID based on the role and URL parameters
  // For admin view with empty clientId (from double-slash URL), we'll use a default
  const activeClientId = (clientId && clientId !== "") 
    ? clientId 
    : (isClientView ? user?.user_metadata?.client_id : undefined);
  
  console.log("WidgetSettings: Using client ID:", activeClientId);
  console.log("WidgetSettings: User role:", userRole);
  console.log("WidgetSettings: Is client view:", isClientView);
  console.log("WidgetSettings: URL clientId param:", clientId);
  
  // Fetch client data if we're in admin view and don't have a specific clientId
  // This will fetch the first client for admin when using /admin/clients//widget-settings
  const { client: firstClient, isLoadingClient } = !isClientView && !activeClientId
    ? useClientData(undefined)
    : { client: null, isLoadingClient: false };
    
  // Use activeClientId for client activity if available, otherwise use the first client's ID
  const effectiveClientId = activeClientId || (firstClient?.id || undefined);
  const { logClientActivity } = useClientActivity(effectiveClientId);

  const widgetSettingsHook = useWidgetSettings(effectiveClientId || '');
  
  // For compatibility with the component
  const adaptedUpdateMutation = {
    isPending: widgetSettingsHook.isUpdating,
    mutateAsync: async (newSettings: any) => {
      widgetSettingsHook.updateSettings(newSettings);
      return null;
    }
  };

  // Check if we are still loading required data
  const isLoading = (widgetSettingsHook.isLoading || (!activeClientId && isLoadingClient));

  const handleBack = () => {
    if (isClientView) {
      navigate('/client/dashboard');
    } else {
      // Always navigate to the client management page for admins
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

  // For admin with double-slash URL, show settings for the first client
  // This is only needed when activeClientId is undefined and we're not in client view
  const shouldUseFirstClient = !isClientView && !activeClientId && firstClient;

  // If we couldn't find any client, show the not found message
  if (!activeClientId && !shouldUseFirstClient) {
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
    ...widgetSettingsHook.settings,
    // Ensure position is a valid WidgetPosition
    position: (widgetSettingsHook.settings.position as WidgetPosition) || 'bottom-right'
  };

  return (
    <WidgetSettingsContainer
      clientId={effectiveClientId || ''}
      settings={completeSettings}
      isClientView={isClientView}
      isUploading={widgetSettingsHook.isUploading}
      updateSettingsMutation={adaptedUpdateMutation}
      handleBack={handleBack}
      handleLogoUpload={(e) => {
        if (e.target.files && e.target.files[0]) {
          widgetSettingsHook.uploadLogo(e.target.files[0]);
        }
      }}
      logClientActivity={logClientActivity}
    />
  );
};

export default WidgetSettings;
