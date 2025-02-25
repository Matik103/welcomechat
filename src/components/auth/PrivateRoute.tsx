
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();

  const { data: userRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ["userRole", session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return null;
      const { data, error } = await supabase
        .from("client_invitations")
        .select("role_type")
        .eq("email", session.user.email)
        .single();
      if (error) throw error;
      return data?.role_type;
    },
    enabled: !!session?.user.id,
  });

  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Only allow admin users to access admin routes
  if (userRole !== "admin") {
    return <Navigate to="/client-dashboard" replace />;
  }

  return <>{children}</>;
};
