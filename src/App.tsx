
import { Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ClientList from "@/pages/ClientList";
import Settings from "@/pages/Settings";
import ClientView from "@/pages/ClientView";
import AddEditClient from "@/pages/AddEditClient";
import WidgetSettings from "@/pages/WidgetSettings";
import { RoleRoute } from "@/components/auth/RoleRoute";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { isLoading, user } = useAuth();

  // Show loading spinner only for a brief moment while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If not loading and no user, show auth page
  if (!user && window.location.pathname !== '/auth') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Index />} />
        <Route path="/admin/clients" element={<ClientList />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/clients/new" element={<AddEditClient />} />
        <Route path="/admin/clients/:id" element={<ClientView />} />
        <Route path="/admin/clients/:id/edit" element={<AddEditClient />} />
        <Route path="/admin/clients/:id/widget-settings" element={<WidgetSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
