
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { SignOutSection } from "@/components/settings/SignOutSection";
import { AdminSetup } from "@/components/settings/AdminSetup";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, userRole } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If not admin, redirect to client settings
    if (userRole === 'client') {
      navigate('/client/settings');
      return;
    }
    
    checkAdminStatus();
  }, [userRole, navigate]);

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

        <SecuritySection />

        <SignOutSection />
      </div>
    </div>
  );
};

export default Settings;
