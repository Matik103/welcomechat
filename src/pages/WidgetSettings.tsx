
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientActivity } from "@/hooks/useClientActivity";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";

const WidgetSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isClientView = !id;
  const clientId = id || user?.user_metadata?.client_id;
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
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <WidgetSettingsContainer
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
