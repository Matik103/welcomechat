
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InvitationData {
  role_type: string;
}

interface ClientRouteProps {
  children: React.ReactNode;
}

export const ClientRoute = ({ children }: ClientRouteProps) => {
  const { session, isLoading } = useAuth();

  const { data: invitation, isLoading: isLoadingRole } = useQuery({
    queryKey: ["userRole", session?.user.email],
    queryFn: async () => {
      if (!session?.user.email) return null;
      const { data } = await supabase
        .from("invitations")
        .select("role_type")
        .eq("email", session.user.email)
        .eq("status", "accepted")
        .maybeSingle();
      
      return (data as InvitationData | null);
    },
    enabled: !!session?.user.email,
    staleTime: 30000,
    retry: false
  });

  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/client-auth" replace />;
  }

  if (!invitation) {
    return <Navigate to="/auth" replace />;
  }

  if (invitation.role_type === "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
