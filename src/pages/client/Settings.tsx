
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSection } from "@/components/client/settings/ProfileSection";
import { WidgetSection } from "@/components/client/settings/WidgetSection";
import { useClientActivity } from "@/hooks/useClientActivity";

const ClientSettings = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { logClientActivity } = useClientActivity(clientId);
  
  // Log settings page visit
  useEffect(() => {
    if (clientId) {
      logClientActivity(
        "settings_viewed", 
        "viewed their settings page", 
        { timestamp: new Date().toISOString() }
      );
    }
  }, [clientId, logClientActivity]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500">Manage your account and widget settings</p>
        </div>

        <div className="space-y-6">
          <ProfileSection />
          <WidgetSection />
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
