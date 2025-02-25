
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { InvitationsSection } from "@/components/settings/InvitationsSection";
import { SignOutSection } from "@/components/settings/SignOutSection";
import { AdminSetup } from "@/components/settings/AdminSetup";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { useMFAHandlers } from "@/components/settings/MFASection";

const Settings = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const mfaHandlers = useMFAHandlers();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('check_user_role', {
          allowed_roles: ['admin']
        });
      
      if (error) throw error;
      setIsAdmin(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <SettingsHeader />

        {isAdmin === false && <AdminSetup />}

        <ProfileSection 
          initialFullName={user?.user_metadata?.full_name || ""}
          initialEmail={user?.email || ""}
        />

        <SecuritySection
          mfaEnabled={mfaHandlers.mfaEnabled}
          qrCode={mfaHandlers.qrCode}
          verificationCode={mfaHandlers.verificationCode}
          currentFactorId={mfaHandlers.currentFactorId}
          isVerifying={mfaHandlers.isVerifying}
          onVerificationCodeChange={mfaHandlers.setVerificationCode}
          onEnableMFA={mfaHandlers.handleEnableMFA}
          onVerifyMFA={mfaHandlers.handleVerifyMFA}
          onDisableMFA={mfaHandlers.handleDisableMFA}
        />

        <InvitationsSection />

        <SignOutSection />
      </div>
    </div>
  );
};

export default Settings;
