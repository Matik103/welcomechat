import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { RoleRoute } from "@/components/auth/RoleRoute";
import { PrivateRoute } from "@/components/auth/PrivateRoute";

// Pages
import Auth from "@/pages/Auth";
import ClientAuth from "@/pages/client/Auth";
import ClientSetup from "@/pages/client/Setup";
import ClientView from "@/pages/client/View";
import AdminDashboard from "@/pages/admin/Dashboard";

// Main App component
export default function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/client/auth" element={<ClientAuth />} />
        <Route path="/client/setup" element={<ClientSetup />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          {/* Admin Routes */}
          <Route element={<RoleRoute allowedRole="admin" />}>
            <Route path="/" element={<AdminDashboard />} />
            {/* Add other admin routes here */}
          </Route>

          {/* Client Routes */}
          <Route element={<RoleRoute allowedRole="client" />}>
            <Route path="/client/view" element={<ClientView />} />
            {/* Add other client routes here */}
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
      <Toaster 
        position="top-right" 
        closeButton
        richColors
      />
    </>
  );
}
