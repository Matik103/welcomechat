
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setIsLoading(false);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          console.log("Auth state changed:", event, currentSession?.user?.email);
          
          if (!mounted) return;

          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (event === 'SIGNED_IN') {
            // Get the user's role
            if (currentSession?.user?.email) {
              const { data: invitation } = await supabase
                .from("client_invitations")
                .select("role_type")
                .eq("email", currentSession.user.email)
                .eq("status", "accepted")
                .single();

              if (invitation?.role_type === "client") {
                navigate("/client-dashboard");
              } else if (invitation?.role_type === "admin") {
                navigate("/clients");
              }
            }
          } else if (event === 'SIGNED_OUT') {
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/client-')) {
              navigate("/client-auth");
            } else {
              navigate("/auth");
            }
          }
        });

        return () => {
          subscription.unsubscribe();
          mounted = false;
        };
      } catch (error) {
        console.error("Auth setup error:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    setupAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      toast.success("Successfully signed out");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
