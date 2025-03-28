
import { useNavigate } from "react-router-dom";

export const useNavigation = () => {
  const navigate = useNavigate();
  
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
    goBack: () => navigate(-1),
  };
};
