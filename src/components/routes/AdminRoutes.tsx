
import { Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";
import Index from "@/pages/Index";
import ClientList from "@/pages/ClientList";
import Agents from "@/pages/Agents";
import Settings from "@/pages/Settings";
import ClientView from "@/pages/ClientView";
import WidgetSettingsPage from "@/pages/WidgetSettings";
import EditClientInfo from "@/pages/EditClientInfo";
import NotFound from "@/pages/NotFound";

export const AdminRoutes = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<Index />} />
        <Route path="/admin/clients" element={<ClientList />} />
        <Route path="/admin/agents" element={<Agents />} />
        <Route path="/admin/agents/:agentId" element={<Agents />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/clients/view/:clientId" element={<ClientView />} />
        <Route path="/admin/clients/:clientId/widget-settings" element={<WidgetSettingsPage />} />
        <Route path="/admin/clients/:id/edit-info" element={<EditClientInfo />} />
        <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/auth" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/auth/callback" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/client/*" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
};
