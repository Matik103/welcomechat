
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingFallback } from './LoadingFallback';
import { ProtectedRoute } from '../ProtectedRoute';
import { ClientRoute } from '../auth/ClientRoute';

// Lazy-loaded client pages
const ClientDashboard = lazy(() => import('@/pages/client/Dashboard'));
const ClientWidgetSettings = lazy(() => import('@/pages/client/WidgetSettings'));
const ClientAccountSettings = lazy(() => import('@/pages/client/AccountSettings'));
const ClientResourceSettings = lazy(() => import('@/pages/client/EditClientInfo'));
const ClientAuth = lazy(() => import('@/pages/client/Auth'));
const ClientProfileSettings = lazy(() => import('@/pages/client/EditProfilePage'));

export default function ClientRoutes() {
  return (
    <Routes>
      <Route 
        path="auth" 
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ClientAuth />
          </Suspense>
        } 
      />
      
      <Route
        path="dashboard"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ClientRoute>
              <ClientDashboard />
            </ClientRoute>
          </Suspense>
        }
      />
      
      <Route
        path="widget-settings"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ClientRoute>
              <ClientWidgetSettings />
            </ClientRoute>
          </Suspense>
        }
      />
      
      <Route
        path="resource-settings"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ClientRoute>
              <ClientResourceSettings />
            </ClientRoute>
          </Suspense>
        }
      />
      
      <Route
        path="account-settings"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ClientRoute>
              <ClientAccountSettings />
            </ClientRoute>
          </Suspense>
        }
      />

      <Route
        path="edit-profile"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ClientRoute>
              <ClientProfileSettings />
            </ClientRoute>
          </Suspense>
        }
      />
    </Routes>
  );
}
