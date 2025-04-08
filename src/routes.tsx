
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ClientView from "./pages/ClientView";
import ClientList from "./pages/ClientList";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import Settings from "./pages/Settings";
import ClientDashboard from "./pages/client/ClientDashboard";
import Agents from "./pages/Agents";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { AdminRoutes } from "./components/routes/AdminRoutes";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { PublicRoutes } from "./components/routes/PublicRoutes";
import { ClientRoutes } from "./components/routes/ClientRoutes";
import { UnauthenticatedRoutes } from "./components/routes/UnauthenticatedRoutes";
import { LoadingFallback } from "./components/routes/LoadingFallback";
import { useAuth } from "./contexts/AuthContext";
import EditClientInfo from "./pages/EditClientInfo";
import WidgetSettings from "./pages/WidgetSettings";

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminAgents = lazy(() => import("./pages/admin/AdminAgents"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminMigrations = lazy(() => import("./pages/admin/AdminMigrations"));
const DocumentExtraction = lazy(() => import("./pages/admin/DocumentExtraction"));
const DatabaseRecovery = lazy(() => import("./pages/admin/DatabaseRecovery"));

export default function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary FallbackComponent={ErrorDisplay}>
        <Routes>
          <Route path="/" element={<PublicRoutes />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          <Route path="/auth" element={<UnauthenticatedRoutes />}>
            <Route index element={<Auth />} />
          </Route>

          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminRoutes />
              </PrivateRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route
              path="clients"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminClients />
                </Suspense>
              }
            />
            <Route
              path="agents"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminAgents />
                </Suspense>
              }
            />
            <Route
              path="analytics"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminAnalytics />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminSettings />
                </Suspense>
              }
            />
            <Route
              path="migrations"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminMigrations />
                </Suspense>
              }
            />
            <Route
              path="document-extraction"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <DocumentExtraction />
                </Suspense>
              }
            />
            <Route
              path="database-recovery"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <DatabaseRecovery />
                </Suspense>
              }
            />
          </Route>

          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <ClientList />
              </PrivateRoute>
            }
          />

          <Route
            path="/client/:id"
            element={
              <PrivateRoute>
                <ClientView />
              </PrivateRoute>
            }
          />

          <Route
            path="/client/:id/edit"
            element={
              <PrivateRoute>
                <EditClientInfo />
              </PrivateRoute>
            }
          />

          <Route
            path="/client/:id/widget-settings"
            element={
              <PrivateRoute>
                <WidgetSettings />
              </PrivateRoute>
            }
          />

          <Route path="/client" element={<ClientRoutes />}>
            <Route
              index
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ClientDashboard />
                </Suspense>
              }
            />
            <Route path="agents" element={<Agents />} />
            <Route
              path="settings"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Settings />
                </Suspense>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
