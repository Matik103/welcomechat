
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from '@/types/auth';

/**
 * Determines the user role based on user metadata or database role
 */
export const determineUserRole = async (user: any): Promise<UserRole | null> => {
  if (!user) return null;

  try {
    // Check if Google SSO user by looking at provider in app_metadata
    if (user.app_metadata?.provider === 'google') {
      console.log("Google user detected in determineUserRole");
      return 'admin';
    }
    
    // First check if the role is already in user metadata
    if (user.user_metadata?.role) {
      return user.user_metadata.role as UserRole;
    }

    // Check database for role
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    if (data?.role) {
      return data.role as UserRole;
    }

    // Check if user is associated with a client
    if (user.user_metadata?.client_id) {
      return 'client';
    }

    // Default to admin for now (this can be customized based on your app logic)
    return 'admin';
  } catch (error) {
    console.error('Error determining user role:', error);
    return null;
  }
};

/**
 * Gets the appropriate dashboard route based on user role
 */
export const getDashboardRoute = (role: UserRole | null): string => {
  if (role === 'admin') {
    return '/admin/dashboard';
  } else if (role === 'client') {
    return '/client/dashboard';
  }
  return '/auth';
};

/**
 * Creates or updates a user's role in the database
 */
export const createUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error creating user role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createUserRole:', error);
    return false;
  }
};

/**
 * Updates the user's metadata with their role
 */
export const updateUserRoleMetadata = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role }
    });

    if (error) {
      console.error('Error updating user metadata:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserRoleMetadata:', error);
    return false;
  }
};
