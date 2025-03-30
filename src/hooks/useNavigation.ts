
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export const useNavigation = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  // Use useCallback to prevent recreation of navigation functions
  const goToClientList = useCallback(() => {
    navigate('/admin/clients');
  }, [navigate]);
  
  const goToClientView = useCallback((clientId: string) => {
    navigate(`/admin/clients/view/${clientId}`);
  }, [navigate]);
  
  const goToEditClient = useCallback((clientId: string) => {
    navigate(`/admin/clients/${clientId}/edit-info`);
  }, [navigate]);
  
  const goToWidgetSettings = useCallback((clientId: string) => {
    navigate(`/admin/clients/${clientId}/widget-settings`);
  }, [navigate]);
  
  const goToClientWidgetSettings = useCallback(() => {
    navigate('/client/widget-settings');
  }, [navigate]);
  
  const goToClientResourceSettings = useCallback(() => {
    navigate('/client/resource-settings');
  }, [navigate]);
  
  const goToClientAccountSettings = useCallback(() => {
    navigate('/client/account-settings');
  }, [navigate]);
  
  const goToClientDashboard = useCallback(() => {
    navigate('/client/dashboard');
  }, [navigate]);
  
  const goToAdminDashboard = useCallback(() => {
    navigate('/admin/dashboard');
  }, [navigate]);
  
  const goToSettings = useCallback(() => {
    navigate('/admin/settings');
  }, [navigate]);
  
  const goToAuth = useCallback(() => {
    // Navigate to the appropriate auth page based on the user role
    if (isAdmin) {
      navigate('/auth', { replace: true });
    } else {
      navigate('/client/auth', { replace: true });
    }
  }, [isAdmin, navigate]);
  
  const goBack = useCallback(() => {
    if (isAdmin) {
      navigate('/admin/clients');
    } else {
      navigate('/client/dashboard');
    }
  }, [isAdmin, navigate]);
  
  return {
    goToClientList,
    goToClientView,
    goToEditClient,
    goToWidgetSettings,
    goToClientWidgetSettings,
    goToClientResourceSettings,
    goToClientAccountSettings,
    goToClientDashboard,
    goToAdminDashboard,
    goToSettings,
    goToAuth,
    goBack,
  };
};
