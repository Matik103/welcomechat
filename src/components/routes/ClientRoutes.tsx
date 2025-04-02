
import { Routes, Route, Navigate } from "react-router-dom";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientSettings from "@/pages/client/Settings";
import AccountSettings from "@/pages/client/AccountSettings";
import ResourceSettings from "@/pages/client/ResourceSettings";
import ClientProfile from "@/pages/client/Profile";
import WidgetSettings from "@/pages/client/WidgetSettings";
import ClientAgents from "@/pages/client/Agents";
import NotFound from "@/pages/NotFound";
import { Toaster } from "sonner";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { useAuth } from "@/contexts/AuthContext";

export const ClientRoutes = () => {
  const { userRole } = useAuth();
  
  // If user is an admin, redirect to admin dashboard
  if (userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/agents" element={<ClientAgents />} />
          <Route path="/client/settings" element={<ClientSettings />} />
          <Route path="/client/account-settings" element={<AccountSettings />} />
          <Route path="/client/resource-settings" element={<ResourceSettings />} />
          <Route path="/client/profile" element={<ClientProfile />} />
          <Route path="/client/widget-settings" element={<WidgetSettings />} />
          <Route path="/auth" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/auth/callback" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/admin/*" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </ClientLayout>
    </div>
  );
};
