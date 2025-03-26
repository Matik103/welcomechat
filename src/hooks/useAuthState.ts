
import { useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

export function useAuthState() {
  // Define useState outside of any conditional to avoid "dispatcher is null" error
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
