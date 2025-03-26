
import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();

  const goToClients = () => {
    navigate('/admin/clients');
  };

  const goToClientDetails = (clientId: string) => {
    navigate(`/admin/clients/${clientId}`);
  };

  const goToDashboard = () => {
    navigate('/admin/dashboard');
  };

  const goToSettings = () => {
    navigate('/admin/settings');
  };

  const goToClientResourceSettings = (clientId: string) => {
    navigate(`/client/resources/${clientId}`);
  };

  const goToClientDashboard = () => {
    navigate('/client/dashboard');
  };

  const goToClientSettings = () => {
    navigate('/client/settings');
  };
  
  const goToWidget = (clientId: string) => {
    navigate(`/widget/${clientId}`);
  };

  const goToClientAccountSettings = () => {
    navigate('/client/account');
  };

  const goToEditClient = (clientId: string) => {
    navigate(`/admin/clients/edit/${clientId}`);
  };

  const goToCreateClient = () => {
    navigate('/admin/clients/new');
  };

  return {
    goToClients,
    goToDashboard,
    goToSettings,
    goToClientDashboard,
    goToClientSettings,
    goToClientResourceSettings,
    goToClientAccountSettings,
    goToEditClient,
    goToCreateClient,
    goToClientDetails,
    goToWidget,
    navigate
  };
};
