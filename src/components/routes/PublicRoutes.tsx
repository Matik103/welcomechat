
import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import ClientAuth from "@/pages/client/Auth";
import { Toaster } from "sonner";
import { LoadingFallback } from "./LoadingFallback";

export const PublicRoutes = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth/*" element={<Auth />} />
          <Route path="/client/auth" element={<ClientAuth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  );
};
