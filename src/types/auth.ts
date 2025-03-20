
import { Session, User } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'client';

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  userRole: UserRole | null;
};
