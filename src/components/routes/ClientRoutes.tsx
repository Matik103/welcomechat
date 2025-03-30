
import { Navigate, Route, Routes } from "react-router-dom";
import ClientDashboard from "@/pages/client/ClientDashboard";
import Dashboard from "@/pages/client/Dashboard";
import AccountSettings from "@/pages/client/AccountSettings";
import ResourceSettings from "@/pages/client/ResourceSettings";
import Settings from "@/pages/client/Settings";
import EditClientInfo from "@/pages/client/EditClientInfo";

export default function ClientRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="old-dashboard" element={<ClientDashboard />} />
      <Route path="settings" element={<Settings />} />
      <Route path="account-settings" element={<AccountSettings />} />
      <Route path="resource-settings" element={<ResourceSettings />} />
      <Route path="profile" element={<EditClientInfo />} />
      <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
    </Routes>
  );
}
