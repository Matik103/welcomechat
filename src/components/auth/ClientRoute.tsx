
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ClientRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || userRole !== 'client') {
    return <Navigate to="/client/auth" replace />;
  }

  return <>{children}</>;
};

export default ClientRoute;
