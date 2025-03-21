
import { createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { AuthContextType } from "@/types/auth";
import { toast } from "sonner";
import { determineUserRole } from "@/utils/authUtils";
import { useAuthStateChange } from "@/hooks/useAuthStateChange";
import { useAuthCallback } from "@/hooks/useAuthCallback";
import { useAuthInitialize } from "@/hooks/useAuthInitialize";
import { useAuthSafetyTimeout } from "@/hooks/useAuthSafetyTimeout";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    session, setSession,
    user, setUser,
    userRole, setUserRole,
    isLoading, setIsLoading,
    authInitialized, setAuthInitialized
  } = useAuthState();
  
  const location = useLocation();
  const isCallbackUrl = location.pathname.includes('/auth/callback');
  const isAuthPage = location.pathname === '/auth';

  // Safety timeout to prevent infinite loading
  useAuthSafetyTimeout({
    isLoading,
    setIsLoading,
    isAuthPage,
    session
  });

  // Handle OAuth callback
  useAuthCallback({
    isCallbackUrl,
    setSession,
    setUser,
    setUserRole,
    setIsLoading
  });

  // Initialize authentication state
  useAuthInitialize({
    authInitialized,
    isCallbackUrl,
    setSession,
    setUser,
    setUserRole,
    setIsLoading,
    setAuthInitialized
  });

  // Handle authentication state changes
  useAuthStateChange({
    setSession,
    setUser,
    setUserRole,
    setIsLoading
  });

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // First update local state (optimistic update)
      const wasAdmin = userRole === 'admin';
      
      setSession(null);
      setUser(null);
      setUserRole(null);
      
      // Clear session storage
      sessionStorage.removeItem('user_role_set');
      sessionStorage.removeItem('auth_callback_processed');
      sessionStorage.removeItem('auth_callback_processing');
      
      // Then call the API to sign out server-side
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Don't force a redirect - rely on the auth state change listener
      // This prevents full page reloads
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Sign out error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signOut, 
      isLoading, 
      userRole 
    }}>
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
