
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/client-admin';
import { User } from '@supabase/supabase-js';

/**
 * Generates a secure temporary password for new clients
 * @returns A secure password string
 */
export const generateTempPassword = (): string => {
  // Generate a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const specialChars = '!@#$%^&*()_+';
  let password = '';
  
  // Generate random base password (8-12 characters)
  const length = Math.floor(Math.random() * 4) + 8; // Length between 8-12
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add at least one uppercase, lowercase, number, and special character
  password += chars.charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += chars.charAt(Math.floor(Math.random() * 26) + 26); // Lowercase
  password += chars.charAt(Math.floor(Math.random() * 10) + 52); // Number
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length)); // Special
  
  // Shuffle the password
  password = password.split('').sort(() => 0.5 - Math.random()).join('');
  
  return password;
};

/**
 * Saves client temporary password to the database
 * @param agentId The agent ID
 * @param email The client email
 * @param tempPassword The temporary password to save
 * @returns Object containing result status and password
 */
export const saveClientTempPassword = async (
  agentId: string,
  email: string,
  tempPassword: string
): Promise<{ success: boolean; error?: string; password?: string }> => {
  try {
    console.log("Saving temporary password for client with agent ID:", agentId);
    
    if (!agentId || !email) {
      return { 
        success: false, 
        error: "Missing required parameters (agentId or email)" 
      };
    }
    
    // Check if user already exists in Supabase Auth - using the correct API
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error fetching users from Supabase Auth:", listError);
      return { 
        success: false, 
        error: `Error fetching users: ${listError.message}` 
      };
    }
    
    // Find the user by email - explicitly typing the users array
    const existingUser = userList.users.find((user: User) => user.email === email);
    
    // If user exists, update their password
    if (existingUser) {
      console.log("User exists, updating password");
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: tempPassword }
      );
      
      if (updateError) {
        console.error("Error updating user password:", updateError);
        return { 
          success: false, 
          error: `Error updating password: ${updateError.message}` 
        };
      }
    } else {
      // User doesn't exist, create them in Supabase Auth
      console.log("User doesn't exist, creating new user");
      
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          role: 'client'
        }
      });
      
      if (createError) {
        console.error("Error creating user:", createError);
        return { 
          success: false, 
          error: `Error creating user: ${createError.message}` 
        };
      }
      
      console.log("Created user successfully:", userData?.user?.id);
    }
    
    // Store in client_temp_passwords table for future reference
    const { error: insertError } = await supabaseAdmin
      .from('client_temp_passwords')
      .insert({
        agent_id: agentId,
        email: email,
        temp_password: tempPassword,
        created_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error("Error storing temporary password:", insertError);
      // Continue anyway since the auth user is created/updated
      console.log("Continuing despite error storing in client_temp_passwords");
    }
    
    return {
      success: true,
      password: tempPassword
    };
  } catch (error) {
    console.error("Exception in saveClientTempPassword:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Gets a client's temporary password from the database
 * @param agentId The agent ID
 * @param email The client email
 * @returns The temporary password if found
 */
export const getClientTempPassword = async (
  agentId: string,
  email: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('client_temp_passwords')
      .select('temp_password')
      .eq('agent_id', agentId)
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error("Error retrieving temporary password:", error);
      return null;
    }
    
    return data?.temp_password || null;
  } catch (error) {
    console.error("Exception in getClientTempPassword:", error);
    return null;
  }
};
