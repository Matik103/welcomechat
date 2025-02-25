
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import type { Database } from "@/types/database.types";

type UserRole = Database['public']['Tables']['user_roles']['Row']['role'];

const App = () => {
  const { data: userRole, isLoading } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching user role:', error);
          return null;
        }
        return roleData?.role as UserRole | null;
      } catch (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
    },
    retry: false
  });

  // If we're still loading the role, show a default route
  if (isLoading) {
    return (
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Header />
            <div>Loading...</div>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            {/* Public route */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Default route that checks role */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  {userRole === 'admin' ? <Index /> : <ClientDashboard />}
                </PrivateRoute>
              }
            />
            
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
