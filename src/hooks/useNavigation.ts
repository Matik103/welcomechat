
import { useNavigate } from "react-router-dom";

export function useNavigation() {
  const navigate = useNavigate();

  const goToWidget = (clientId: string) => {
    navigate(`/client/widget/${clientId}`);
  };

  const goToDashboard = () => {
    navigate("/client/dashboard");
  };

  const goToResourceSettings = (clientId: string) => {
    navigate(`/client/resources/${clientId}`);
  };

  return {
    goToWidget,
    goToDashboard,
    goToResourceSettings
  };
}
