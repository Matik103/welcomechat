import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Auth page specifically for clients
const ClientAuth = () => {
  const { user, userRole, isLoading } = useAuth();

  useEffect(() => {
    document.title = 'Client Login | Welcome.Chat';
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    if (userRole === 'client') {
      return <Navigate to="/client/dashboard" replace />;
    } else if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to Your Client Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Log in to manage your AI assistant
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Client login form will be here */}
          <p className="text-center text-sm text-gray-600">
            Client login implementation will be added here
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientAuth;
