
import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import ClientAuth from "@/pages/client/Auth";
import { Toaster } from "sonner";
import { LoadingFallback } from "./LoadingFallback";

export const UnauthenticatedRoutes = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/auth/*" element={<Auth />} />
          <Route path="/client/auth" element={<ClientAuth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  );
};
