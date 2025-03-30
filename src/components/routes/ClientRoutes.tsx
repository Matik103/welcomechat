
import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ClientHeader } from "@/components/layout/ClientHeader";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientSettings from "@/pages/client/Settings";
import AccountSettings from "@/pages/client/AccountSettings";
import ResourceSettings from "@/pages/client/ResourceSettings";
import EditClientInfo from "@/pages/client/EditClientInfo";
import WidgetSettings from "@/pages/WidgetSettings";
import NotFound from "@/pages/NotFound";
import { Toaster } from "sonner";
import { LoadingFallback } from "./LoadingFallback";

export const ClientRoutes = () => {
  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/settings" element={<ClientSettings />} />
          <Route path="/client/account-settings" element={<AccountSettings />} />
          <Route path="/client/resource-settings" element={<ResourceSettings />} />
          <Route path="/client/edit-info" element={<EditClientInfo />} />
          <Route path="/client/widget-settings" element={<WidgetSettings />} />
          <Route path="/auth" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/auth/callback" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/admin/*" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  );
};
