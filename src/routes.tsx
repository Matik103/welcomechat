import React from 'react';
import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const HomePage = React.lazy(() => import('./pages/Home'));
const AboutPage = React.lazy(() => import('./pages/About'));
const ContactPage = React.lazy(() => import('./pages/Contact'));
const AuthPage = React.lazy(() => import('./pages/Auth'));
const ClientListPage = React.lazy(() => import('./pages/ClientList'));
const ClientDashboardPage = React.lazy(() => import('./pages/client/Dashboard'));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAgentsPage = React.lazy(() => import('./pages/admin/AdminAgents'));
const AdminClientsPage = React.lazy(() => import('./pages/admin/AdminClients'));
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminLogsPage = React.lazy(() => import('./pages/admin/AdminLogs'));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminMigrationsPage = React.lazy(() => import('./pages/admin/AdminMigrations'));
const AdminAnalyticsPage = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const DocumentExtractionPage = React.lazy(() => import('./pages/admin/DocumentExtraction'));
const ClientViewPage = React.lazy(() => import('./pages/ClientView'));
const EditClientInfoPage = React.lazy(() => import('./pages/EditClientInfo'));
const WidgetSettingsPage = React.lazy(() => import('./pages/WidgetSettings'));
const ClientResourceSettingsPage = React.lazy(() => import('./pages/client/ResourceSettings'));
const ClientSettingsPage = React.lazy(() => import('./pages/client/Settings'));
const ClientAccountSettingsPage = React.lazy(() => import('./pages/client/AccountSettings'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <React.Suspense fallback={<div>Loading...</div>}><HomePage /></React.Suspense>,
  },
  {
    path: '/about',
    element: <React.Suspense fallback={<div>Loading...</div>}><AboutPage /></React.Suspense>,
  },
  {
    path: '/contact',
    element: <React.Suspense fallback={<div>Loading...</div>}><ContactPage /></React.Suspense>,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/auth/*',
    element: <AuthPage />,
  },
  {
    path: '/client/dashboard',
    element: <ProtectedRoute requiredRole="client"><React.Suspense fallback={<div>Loading...</div>}><ClientDashboardPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminDashboardPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/dashboard',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminDashboardPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/agents',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminAgentsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/clients',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><ClientListPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/clients/view/:clientId',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><ClientViewPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/clients/:id/edit-info',
    element: (
      <ProtectedRoute requiredRole="admin">
        <React.Suspense fallback={<div>Loading...</div>}>
          <EditClientInfoPage />
        </React.Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/clients/:clientId/widget-settings',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><WidgetSettingsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/users',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminUsersPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/logs',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminLogsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/settings',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminSettingsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/migrations',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminMigrationsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/analytics',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminAnalyticsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/document-extraction',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><DocumentExtractionPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/client/edit-info',
    element: (
      <ProtectedRoute requiredRole="client">
        <React.Suspense fallback={<div>Loading...</div>}>
          <EditClientInfoPage />
        </React.Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/client/widget-settings',
    element: <ProtectedRoute requiredRole="client"><React.Suspense fallback={<div>Loading...</div>}><WidgetSettingsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/client/resource-settings',
    element: <ProtectedRoute requiredRole="client"><React.Suspense fallback={<div>Loading...</div>}><ClientResourceSettingsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/client/settings',
    element: <ProtectedRoute requiredRole="client"><React.Suspense fallback={<div>Loading...</div>}><ClientSettingsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/client/account-settings',
    element: <ProtectedRoute requiredRole="client"><React.Suspense fallback={<div>Loading...</div>}><ClientAccountSettingsPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '*',
    element: <React.Suspense fallback={<div>Loading...</div>}>Not Found</React.Suspense>,
  },
];

export const adminRoutes = [
  {
    path: "dashboard",
    element: <AdminDashboardPage />,
  },
  {
    path: "clients",
    element: <AdminClientsPage />,
  },
];
