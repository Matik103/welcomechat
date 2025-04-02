
import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";
import Index from "@/pages/Index";
import ClientList from "@/pages/ClientList";
import Agents from "@/pages/Agents";
import Settings from "@/pages/Settings";
import ClientView from "@/pages/ClientView";
import WidgetSettings from "@/pages/WidgetSettings";
import EditClientInfo from "@/pages/EditClientInfo";
import NotFound from "@/pages/NotFound";
import { LoadingFallback } from "./LoadingFallback";
import { RoleRoute } from "@/components/auth/RoleRoute";

export const AdminRoutes = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={
            <RoleRoute allowedRoles={['admin']}>
              <Index />
            </RoleRoute>
          } />
          <Route path="/admin/clients" element={
            <RoleRoute allowedRoles={['admin']}>
              <ClientList />
            </RoleRoute>
          } />
          <Route path="/admin/agents" element={
            <RoleRoute allowedRoles={['admin']}>
              <Agents />
            </RoleRoute>
          } />
          <Route path="/admin/agents/:agentId" element={
            <RoleRoute allowedRoles={['admin']}>
              <Agents />
            </RoleRoute>
          } />
          <Route path="/admin/settings" element={
            <RoleRoute allowedRoles={['admin']}>
              <Settings />
            </RoleRoute>
          } />
          <Route path="/admin/clients/view/:clientId" element={
            <RoleRoute allowedRoles={['admin']}>
              <ClientView />
            </RoleRoute>
          } />
          <Route path="/admin/clients/:clientId/widget-settings" element={
            <RoleRoute allowedRoles={['admin']}>
              <WidgetSettings />
            </RoleRoute>
          } />
          <Route path="/admin/clients/:id/edit-info" element={
            <RoleRoute allowedRoles={['admin']}>
              <EditClientInfo />
            </RoleRoute>
          } />
          <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
          <Route path="/auth" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/auth/callback" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/client/*" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  );
};
