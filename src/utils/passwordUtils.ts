import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/client-admin';
import { generateRandomPassword } from './stringUtils';

/**
 * Generates a random password and updates the user's password in Supabase
 * @param userId The ID of the user to update
 * @returns The new password
 */
export const generateAndUpdatePassword = async (userId: string): Promise<string | null> => {
  try {
    // Generate a random password
    const newPassword = generateRandomPassword();
    
    // Hash the new password
    const { data, error } = await supabaseAdmin?.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    
    if (error) {
      console.error("Error updating password:", error);
      return null;
    }
    
    console.log("Password updated successfully for user:", userId);
    return newPassword;
  } catch (error) {
    console.error("Error in generateAndUpdatePassword:", error);
    return null;
  }
};

/**
 * Sends a password reset email to the user
 * @param email The email address of the user to send the reset email to
 * @returns True if the email was sent successfully, false otherwise
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    if (!isAdminClientConfigured()) {
      console.error('Admin client not configured - cannot send password reset email');
      return false;
    }
    
    // Send the password reset email
    const { data, error } = await supabaseAdmin?.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (error) {
      console.error("Error sending password reset email:", error);
      return false;
    }
    
    console.log("Password reset email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("Error in sendPasswordResetEmail:", error);
    return false;
  }
};

/**
 * Updates the user's password in Supabase
 * @param userId The ID of the user to update
 * @param newPassword The new password to set
 * @returns True if the password was updated successfully, false otherwise
 */
export const updatePassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    if (!isAdminClientConfigured()) {
      console.error('Admin client not configured - cannot update password');
      return false;
    }
    
    // Hash the new password
    const { data, error } = await supabaseAdmin?.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    
    if (error) {
      console.error("Error updating password:", error);
      return false;
    }
    
    console.log("Password updated successfully for user:", userId);
    return true;
  } catch (error) {
    console.error("Error in updatePassword:", error);
    return false;
  }
};
