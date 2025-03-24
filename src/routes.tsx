
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const HomePage = React.lazy(() => import('./pages/Home'));
const AboutPage = React.lazy(() => import('./pages/About'));
const ContactPage = React.lazy(() => import('./pages/Contact'));
const AuthPage = React.lazy(() => import('./pages/Auth'));
const ClientDashboardPage = React.lazy(() => import('./pages/client/ClientDashboard'));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAgentsPage = React.lazy(() => import('./pages/admin/AdminAgents'));
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminLogsPage = React.lazy(() => import('./pages/admin/AdminLogs'));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminMigrationsPage = React.lazy(() => import('./pages/admin/AdminMigrations'));
const AdminAnalyticsPage = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const DocumentExtractionPage = React.lazy(() => import('./pages/admin/DocumentExtraction'));

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
    path: '/client',
    element: <ProtectedRoute><React.Suspense fallback={<div>Loading...</div>}><ClientDashboardPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminDashboardPage /></React.Suspense></ProtectedRoute>,
  },
  {
    path: '/admin/agents',
    element: <ProtectedRoute requiredRole="admin"><React.Suspense fallback={<div>Loading...</div>}><AdminAgentsPage /></React.Suspense></ProtectedRoute>,
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
];
