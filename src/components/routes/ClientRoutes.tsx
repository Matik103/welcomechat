
import { Suspense } from "react";
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
import { LoadingFallback } from "./LoadingFallback";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { RoleRoute } from "@/components/auth/RoleRoute";

export const ClientRoutes = () => {
  return (
    <div className="min-h-screen bg-background">
      <ClientLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
            <Route path="/client/dashboard" element={
              <RoleRoute allowedRoles={['client']}>
                <ClientDashboard />
              </RoleRoute>
            } />
            <Route path="/client/agents" element={
              <RoleRoute allowedRoles={['client']}>
                <ClientAgents />
              </RoleRoute>
            } />
            <Route path="/client/settings" element={
              <RoleRoute allowedRoles={['client']}>
                <ClientSettings />
              </RoleRoute>
            } />
            <Route path="/client/account-settings" element={
              <RoleRoute allowedRoles={['client']}>
                <AccountSettings />
              </RoleRoute>
            } />
            <Route path="/client/resource-settings" element={
              <RoleRoute allowedRoles={['client']}>
                <ResourceSettings />
              </RoleRoute>
            } />
            <Route path="/client/profile" element={
              <RoleRoute allowedRoles={['client']}>
                <ClientProfile />
              </RoleRoute>
            } />
            <Route path="/client/widget-settings" element={
              <RoleRoute allowedRoles={['client']}>
                <WidgetSettings />
              </RoleRoute>
            } />
            <Route path="/auth" element={<Navigate to="/client/dashboard" replace />} />
            <Route path="/auth/callback" element={<Navigate to="/client/dashboard" replace />} />
            <Route path="/admin/*" element={<Navigate to="/client/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </ClientLayout>
    </div>
  );
};
