
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { Header } from "@/components/layout/Header";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientList from "./pages/ClientList";
import AddEditClient from "./pages/AddEditClient";
import ClientView from "./pages/ClientView";
import WidgetSettings from "./pages/WidgetSettings";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ClientDashboard from "./pages/ClientDashboard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const App = () => {
  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Query the user_roles table
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error || !roleData) return null;
      return roleData.role;
    }
  });

  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            {/* Admin routes */}
            {userRole === 'admin' && (
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Index />
                  </PrivateRoute>
                }
              />
            )}
            
            {/* Client routes - redirect to client dashboard if not admin */}
            {userRole === 'client' && (
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <ClientDashboard />
                  </PrivateRoute>
                }
              />
            )}
            
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes for both admin and client */}
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            
            {/* Admin-only routes */}
            {userRole === 'admin' && (
              <>
                <Route
                  path="/clients"
                  element={
                    <PrivateRoute>
                      <ClientList />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/clients/new"
                  element={
                    <PrivateRoute>
                      <AddEditClient />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/clients/:id"
                  element={
                    <PrivateRoute>
                      <ClientView />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/clients/:id/edit"
                  element={
                    <PrivateRoute>
                      <AddEditClient />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/clients/:id/widget-settings"
                  element={
                    <PrivateRoute>
                      <WidgetSettings />
                    </PrivateRoute>
                  }
                />
              </>
            )}
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
};

export default App;
