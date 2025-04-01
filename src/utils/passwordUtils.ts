
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
    
    // Check if admin client is configured
    if (!isAdminClientConfigured() || !supabaseAdmin) {
      console.error('Admin client not configured - cannot update password');
      return null;
    }
    
    // Hash the new password
    const response = await supabaseAdmin?.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    
    if (response?.error) {
      console.error("Error updating password:", response.error);
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
 * Generates a temporary password for a new user
 * @returns A temporary password
 */
export const generateTempPassword = (): string => {
  return generateRandomPassword(16);
};

/**
 * Saves a temporary password for a client user
 * @param agentId The agent ID (which is also the client ID)
 * @param email The client's email address
 * @param tempPassword The temporary password to set
 * @returns Object containing the result and password
 */
export const saveClientTempPassword = async (
  agentId: string,
  email: string,
  tempPassword: string
): Promise<{ success: boolean; password: string | null; error?: string }> => {
  try {
    // Check if admin client is configured
    if (!isAdminClientConfigured() || !supabaseAdmin) {
      console.error('Admin client not configured - cannot save temp password');
      return { success: false, password: null, error: 'Admin client not configured' };
    }
    
    // Check if the user already exists
    const response = await supabaseAdmin?.auth.admin.listUsers();
    
    if (response?.error) {
      console.error("Error checking if user exists:", response.error);
      return { success: false, password: null, error: response.error.message };
    }
    
    // Find user by email
    const existingUser = response?.data?.users?.find(user => user.email === email);
    
    if (existingUser) {
      // Update existing user's password
      const updateResponse = await supabaseAdmin?.auth.admin.updateUserById(
        existingUser.id,
        { password: tempPassword }
      );
      
      if (updateResponse?.error) {
        console.error("Error updating user password:", updateResponse.error);
        return { success: false, password: null, error: updateResponse.error.message };
      }
    } else {
      // Create new user
      const createUserResponse = await supabaseAdmin?.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          client_id: agentId,
          role: 'client'
        }
      });
      
      if (createUserResponse?.error) {
        console.error("Error creating user:", createUserResponse.error);
        return { success: false, password: null, error: createUserResponse.error.message };
      }
    }
    
    console.log(`Temporary password set for ${email}`);
    return { success: true, password: tempPassword };
  } catch (error) {
    console.error("Error in saveClientTempPassword:", error);
    return { 
      success: false, 
      password: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Sends a password reset email to the user
 * @param email The email address of the user to send the reset email to
 * @returns True if the email was sent successfully, false otherwise
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    if (!isAdminClientConfigured() || !supabaseAdmin) {
      console.error('Admin client not configured - cannot send password reset email');
      return false;
    }
    
    // Send the password reset email
    const response = await supabaseAdmin?.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (response?.error) {
      console.error("Error sending password reset email:", response.error);
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
    if (!isAdminClientConfigured() || !supabaseAdmin) {
      console.error('Admin client not configured - cannot update password');
      return false;
    }
    
    // Update the user's password
    const response = await supabaseAdmin?.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    
    if (response?.error) {
      console.error("Error updating password:", response.error);
      return false;
    }
    
    console.log("Password updated successfully for user:", userId);
    return true;
  } catch (error) {
    console.error("Error in updatePassword:", error);
    return false;
  }
};
