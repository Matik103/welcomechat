
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminClients from "@/pages/admin/AdminClients";
import ClientView from "@/pages/ClientView";
import Settings from "@/pages/Settings";
import EditClientInfo from "@/pages/EditClientInfo";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminAgents from "@/pages/admin/AdminAgents";
import DocumentExtraction from "@/pages/admin/DocumentExtraction";
import WidgetSettings from "@/pages/WidgetSettings";

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="clients" element={<AdminClients />} />
      <Route path="agents" element={<AdminAgents />} />
      <Route path="extraction" element={<DocumentExtraction />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="clients/view/:clientId" element={<ClientView />} />
      <Route path="clients/:clientId/edit-info" element={<EditClientInfo />} />
      <Route path="clients/:clientId/widget-settings" element={<WidgetSettings />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};
