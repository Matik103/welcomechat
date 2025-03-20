
import { UserRole } from "@/types/auth";

/**
 * Utility functions for authentication
 */

export const isValidRole = (role: string): role is UserRole => {
  return role === 'admin' || role === 'client';
};

/**
 * Determines the user role based on user data
 */
export const determineUserRole = async (user: any): Promise<UserRole> => {
  if (!user) return 'client';
  
  // Check if user has a role in metadata
  if (user.user_metadata?.role && isValidRole(user.user_metadata.role)) {
    return user.user_metadata.role as UserRole;
  }
  
  // Check if user has a client_id in metadata (indicates client role)
  if (user.user_metadata?.client_id) {
    return 'client';
  }
  
  // Default to admin for Google users or when no other role is found
  if (user.app_metadata?.provider === 'google') {
    return 'admin';
  }
  
  // Default role
  return 'admin';
};

/**
 * Gets the appropriate dashboard route based on user role
 */
export const getDashboardRoute = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin/clients';
    case 'client':
      return '/client/dashboard';
    default:
      return '/auth';
  }
};

/**
 * Creates a user role in the database
 */
export const createUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    // Implementation would call supabase to create user role
    // This is a placeholder that would be replaced with actual implementation
    console.log(`Creating role ${role} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error creating user role:', error);
    return false;
  }
};
