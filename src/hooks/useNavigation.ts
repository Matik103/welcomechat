
import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();

  const goToClients = () => navigate('/admin/clients');
  const goToDashboard = () => navigate('/admin/dashboard');
  const goToSettings = () => navigate('/admin/settings');
  const goToClientDashboard = () => navigate('/client/dashboard');
  const goToClientSettings = () => navigate('/client/settings');
  const goToClientResourceSettings = () => navigate('/client/resource-settings');
  const goToClientAccountSettings = () => navigate('/client/account-settings');
  const goToClientView = (clientId: string) => navigate(`/admin/clients/view/${clientId}`);
  const goToClientEdit = (clientId: string) => navigate(`/admin/clients/${clientId}/edit`);
  const goToWidgetSettings = (clientId: string) => navigate(`/admin/clients/${clientId}/widget-settings`);
  const goToClientWidgetSettings = () => navigate('/client/widget-settings');
  const goBack = () => navigate(-1);

  return {
    goToClients,
    goToDashboard,
    goToSettings,
    goToClientDashboard,
    goToClientSettings,
    goToClientResourceSettings,
    goToClientAccountSettings,
    goToClientView,
    goToClientEdit,
    goToWidgetSettings,
    goToClientWidgetSettings,
    goBack,
    navigate
  };
};
