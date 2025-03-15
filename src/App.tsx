
import { Header } from "@/components/layout/Header";
import { ClientHeader } from "@/components/layout/ClientHeader";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ClientList from "@/pages/ClientList";
import Settings from "@/pages/Settings";
import ClientView from "@/pages/ClientView";
import AddEditClient from "@/pages/AddEditClient";
import WidgetSettings from "@/pages/WidgetSettings";
import { useAuth } from "./contexts/AuthContext";
import ClientSettings from "@/pages/client/Settings";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientSetup from "@/pages/client/Setup";
import { useEffect, useState } from "react";
import AccountSettings from "@/pages/client/AccountSettings";
import ResourceSettings from "@/pages/client/ResourceSettings";
import EditClientInfo from "@/pages/client/EditClientInfo";
import { Toaster } from "sonner";
import NotFound from "@/pages/NotFound";

function App() {
  const { isLoading, user, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle callback route - redirect immediately to home based on user role
  useEffect(() => {
    if (location.pathname.includes('/auth/callback') && user && userRole) {
      console.log("Auth callback detected, redirecting based on role:", userRole);
      if (userRole === 'admin') {
        navigate('/', { replace: true });
      } else {
        navigate('/client/dashboard', { replace: true });
      }
    }
  }, [location.pathname, user, userRole, navigate]);

  // Handle the case where we're on the callback page but auth is still loading
  if (location.pathname.includes('/auth/callback')) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-sm text-muted-foreground">Completing authentication...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading spinner during auth check, but only if not on a public route
  // Determine if current route is a public route (auth, setup, or callback)
  const isPublicRoute = 
    location.pathname === '/auth' || 
    location.pathname.includes('/auth/callback') ||
    location.pathname.startsWith('/client/setup');
    
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  // Auth page doesn't need layout or role checks
  if (location.pathname === '/auth') {
    return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <Auth />
      </div>
    );
  }

  // Handle the case where we have user and role info
  if (user && userRole) {
    // Determine if current route is a client-specific route
    const isClientRoute = 
      location.pathname.startsWith('/client') && 
      !location.pathname.startsWith('/client/setup');

    return (
      <div className="min-h-screen bg-background">
        {isClientRoute ? <ClientHeader /> : <Header />}
        <Routes>
          {/* Auth routes */}
          <Route path="/auth/*" element={<Navigate to="/" replace />} />
          <Route path="/client/setup" element={<ClientSetup />} />
          
          {/* Main routes with role-based routing */}
          <Route path="/" element={
            userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <Index />
          } />
          
          {/* Admin routes */}
          <Route path="/admin/clients" element={
            userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <ClientList />
          } />
          <Route path="/settings" element={
            userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <Settings />
          } />
          <Route path="/admin/clients/new" element={
            userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <AddEditClient />
          } />
          <Route path="/admin/clients/:id" element={
            userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <ClientView />
          } />
          <Route path="/admin/clients/:id/edit" element={
            userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <AddEditClient />
          } />
          <Route path="/admin/clients/:id/widget-settings" element={
            userRole === 'client' ? <Navigate to="/client/dashboard" replace /> : <WidgetSettings />
          } />
          
          {/* Client routes */}
          <Route path="/client/view" element={
            <Navigate to="/client/dashboard" replace />
          } />
          <Route path="/client/dashboard" element={
            userRole === 'admin' ? <Navigate to="/" replace /> : <ClientDashboard />
          } />
          <Route path="/client/settings" element={
            userRole === 'admin' ? <Navigate to="/settings" replace /> : <ClientSettings />
          } />
          <Route path="/client/widget-settings" element={
            userRole === 'admin' ? <Navigate to="/" replace /> : <WidgetSettings />
          } />
          <Route path="/client/account-settings" element={
            userRole === 'admin' ? <Navigate to="/" replace /> : <AccountSettings />
          } />
          <Route path="/client/resource-settings" element={
            userRole === 'admin' ? <Navigate to="/" replace /> : <ResourceSettings />
          } />
          <Route path="/client/edit-info" element={
            userRole === 'admin' ? <Navigate to="/" replace /> : <EditClientInfo />
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    );
  }

  // If auth is no longer loading but we don't have a user and we're not on a public route
  if (!isLoading && !user && !isPublicRoute) {
    return <Navigate to="/auth" replace />;
  }

  // Public routes or waiting for role determination with minimal loader
  return (
    <div className="min-h-screen bg-background">
      {location.pathname.startsWith('/client') && !location.pathname.startsWith('/client/setup') 
        ? <ClientHeader /> 
        : <Header />}
      <Routes>
        {/* Auth routes */}
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/client/setup" element={<ClientSetup />} />
        
        {/* If trying to access restricted routes without auth, redirect */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
