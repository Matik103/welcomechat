
import { useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

export function useAuthState() {
  // Define state inside the function body
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  return {
    session,
    setSession,
    user,
    setUser,
    userRole,
    setUserRole,
    isLoading,
    setIsLoading,
    authInitialized,
    setAuthInitialized
  };
}
