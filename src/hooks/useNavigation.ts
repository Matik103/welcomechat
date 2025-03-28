
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const useNavigation = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  return {
    goToClientList: () => navigate('/admin/clients'),
    goToClientView: (clientId: string) => navigate(`/admin/clients/view/${clientId}`),
    goToEditClient: (clientId: string) => navigate(`/admin/clients/${clientId}/edit-info`),
    goToWidgetSettings: (clientId: string) => navigate(`/admin/clients/${clientId}/widget-settings`),
    goToClientWidgetSettings: () => navigate('/client/widget-settings'),
    goToClientResourceSettings: () => navigate('/client/resource-settings'),
    goToClientAccountSettings: () => navigate('/client/account-settings'),
    goToClientDashboard: () => navigate('/client/dashboard'),
    goToAdminDashboard: () => navigate('/admin/dashboard'),
    goToSettings: () => navigate('/admin/settings'),
    goBack: () => {
      if (isAdmin) {
        navigate('/admin/clients');
      } else {
        navigate('/client/dashboard');
      }
    },
  };
};
