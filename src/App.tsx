
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSettings from "@/pages/client/ProfileSettings";

function App() {
  const { isLoading, user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/client/view" />
            ) : (
              <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
                  <h1 className="text-2xl font-bold text-center">Welcome to Client Portal</h1>
                  <p className="text-center text-gray-600">Please log in to continue</p>
                  <button
                    className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-600"
                    onClick={() => window.location.href = '/login'}
                  >
                    Login
                  </button>
                </div>
              </div>
            )
          } 
        />

        {/* Client routes */}
        <Route path="/client">
          <Route path="profile-settings" element={<ProfileSettings />} />
          <Route path="view" element={<div>Client Dashboard</div>} />
          <Route path="widget-settings" element={<div>Widget Settings</div>} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
