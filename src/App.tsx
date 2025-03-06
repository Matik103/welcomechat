import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Account from './pages/Account';
import Home from './pages/Home';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientDashboard from './pages/client/ClientDashboard';
import WidgetSettings from './pages/client/WidgetSettings';
import { AdminRoute } from './components/auth/AdminRoute';
import { ClientRoute } from './components/auth/ClientRoute';
import { AuthRoute } from './components/auth/AuthRoute';
import { useAuth } from './contexts/AuthContext';
import ClientSetup from './pages/auth/ClientSetup';
import InvitationLanding from './pages/auth/InvitationLanding';
import ProfileSettings from "./pages/client/ProfileSettings";

function App() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useAuth();
  const [isClientSetupComplete, setIsClientSetupComplete] = useState(false);

  useEffect(() => {
    const checkClientSetup = async () => {
      if (session && session.user) {
        const { data: user_roles, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', session.user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          return;
        }

        if (user_roles && user_roles.length > 0) {
          setIsClientSetupComplete(true);
        } else {
          setIsClientSetupComplete(false);
        }
      } else {
        setIsClientSetupComplete(false);
      }
    };

    checkClientSetup();
  }, [session, supabase]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          exact
          path="/"
          element={
            <AuthRoute>
              <Home />
            </AuthRoute>
          }
        />
        <Route
          exact
          path="/account"
          element={
            <AuthRoute>
              <Account session={session} />
            </AuthRoute>
          }
        />
        <Route
          path="/auth/client-setup"
          element={
            <AuthRoute>
              <ClientSetup />
            </AuthRoute>
          }
        />
        <Route
          path="/invitation/:token"
          element={
            <AuthRoute>
              <InvitationLanding />
            </AuthRoute>
          }
        />
        <Route
          path="/login"
          element={
            !session ? (
              <div className="container" style={{ padding: '50px 0 100px 0' }}>
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                  providers={['google', 'github']}
                  redirectTo={`${window.location.origin}/account`}
                />
              </div>
            ) : (
              <Navigate to="/account" />
            )
          }
        />

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Client routes */}
        <Route element={<ClientRoute />}>
          <Route path="/client/view" element={<ClientDashboard />} />
          <Route path="/client/widget-settings" element={<WidgetSettings />} />
          <Route path="/client/profile-settings" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
