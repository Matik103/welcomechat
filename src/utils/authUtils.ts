import { UserRole } from "@/types/auth";

/**
 * Utility functions for authentication
 */

export const isValidRole = (role: string): role is UserRole => {
  return role === 'admin' || role === 'client';
};
