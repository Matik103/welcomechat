
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { ClientRoute } from "@/components/auth/ClientRoute";
import { Header } from "@/components/layout/Header";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientAuth from "./pages/client/Auth";
import ClientDashboard from "./pages/client/Dashboard";
import ClientSettings from "./pages/client/Settings";
import ClientList from "./pages/ClientList";
import AddEditClient from "./pages/AddEditClient";
import ClientView from "./pages/ClientView";
import WidgetSettings from "./pages/WidgetSettings";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            {/* Admin routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Index />
                </PrivateRoute>
              }
            />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
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

            {/* Client routes */}
            <Route path="/client-auth" element={<ClientAuth />} />
            <Route
              path="/client-dashboard"
              element={
                <ClientRoute>
                  <ClientDashboard />
                </ClientRoute>
              }
            />
            <Route
              path="/client-settings"
              element={
                <ClientRoute>
                  <ClientSettings />
                </ClientRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
