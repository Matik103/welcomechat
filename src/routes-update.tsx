
import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NewIndex from "@/pages/NewIndex";
import NewAdminClientsPage from "@/pages/admin/NewAdminClients";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <NewIndex />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          <NewIndex />
        </ProtectedRoute>
      } />
      <Route path="/admin/clients" element={
        <ProtectedRoute>
          <NewAdminClientsPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
};
