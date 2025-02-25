
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type InvitationType = {
  role_type: 'admin' | 'client';
};

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  const { data: invitation, isLoading: isLoadingRole } = useQuery({
    queryKey: ["userRole", session?.user.email],
    queryFn: async () => {
      if (!session?.user.email) return null;
      const { data, error } = await supabase
        .from("client_invitations")
        .select("role_type")
        .eq("email", session.user.email)
        .eq("status", "accepted")
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching role:", error);
        return null;
      }
      return data as InvitationType | null;
    },
    enabled: !!session?.user.email,
  });

  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Only allow admin users to access admin routes
  if (invitation?.role_type !== "admin") {
    return <Navigate to="/client-dashboard" replace />;
  }

  return <>{children}</>;
};
