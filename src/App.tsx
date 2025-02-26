
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
import Dashboard from "@/pages/client/Dashboard";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={
          <RoleRoute allowedRoles={['admin', 'client']}>
            <Index />
          </RoleRoute>
        } />
        <Route path="/admin" element={
          <RoleRoute allowedRoles={['admin']}>
            <Index />
          </RoleRoute>
        } />
        <Route path="/dashboard" element={
          <RoleRoute allowedRoles={['client']}>
            <Dashboard />
          </RoleRoute>
        } />
        <Route path="/admin/clients" element={
          <RoleRoute allowedRoles={['admin']}>
            <ClientList />
          </RoleRoute>
        } />
        <Route path="/settings" element={
          <RoleRoute allowedRoles={['admin', 'client']}>
            <Settings />
          </RoleRoute>
        } />
        <Route path="/clients/new" element={
          <RoleRoute allowedRoles={['admin']}>
            <AddEditClient />
          </RoleRoute>
        } />
        <Route path="/clients/:id" element={
          <RoleRoute allowedRoles={['admin']}>
            <ClientView />
          </RoleRoute>
        } />
        <Route path="/clients/:id/edit" element={
          <RoleRoute allowedRoles={['admin']}>
            <AddEditClient />
          </RoleRoute>
        } />
        <Route path="/clients/:id/widget-settings" element={
          <RoleRoute allowedRoles={['admin', 'client']}>
            <WidgetSettings />
          </RoleRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
