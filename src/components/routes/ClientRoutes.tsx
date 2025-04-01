
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ClientHeader } from "@/components/layout/ClientHeader";
import { Toaster } from "sonner";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientSettings from "@/pages/client/Settings";
import ClientAccountSettings from "@/pages/client/AccountSettings";
import ClientResourceSettings from "@/pages/client/ResourceSettings";
import ClientWidgetSettings from "@/pages/client/WidgetSettings";
import { LoadingFallback } from "./LoadingFallback";
import NotFound from "@/pages/NotFound";

export const ClientRoutes = () => {
  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/settings" element={<ClientSettings />} />
          <Route path="/client/account-settings" element={<ClientAccountSettings />} />
          <Route path="/client/resource-settings" element={<ClientResourceSettings />} />
          <Route path="/client/widget-settings" element={<ClientWidgetSettings />} />
          <Route path="/client/*" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  );
};
