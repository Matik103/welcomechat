
import { supabaseAdmin } from '@/integrations/supabase/admin';

// Generate a temporary password
export const generateTempPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Alias for backward compatibility
export const generateClientTempPassword = generateTempPassword;

// Save a temporary password for a client
export const saveClientTempPassword = async (
  agentId: string,
  email: string,
  tempPassword?: string
): Promise<any> => {
  try {
    // First create or update the Supabase Auth user
    const generatedPassword = tempPassword || generateTempPassword();
    
    // Check if user exists by listing users
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw listError;
    }
    
    // Find the user with the exact matching email by safely handling potential undefined values
    const users = listData?.users || [];
    const existingUser = users.find(user => user?.email === email);
    
    let userId: string;
    
    // If user doesn't exist, create it
    if (!existingUser) {
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: { role: 'client' }
      });
      
      if (createError) {
        console.error("Error creating auth user:", createError);
        throw createError;
      }
      
      userId = authData.user.id;
      
      // Add the user to the client role
      const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: userId,
        role: 'client'
      });
      
      if (roleError) {
        console.error("Error assigning client role:", roleError);
        // Continue execution even if role assignment fails
      }
      
      console.log("Created auth user for:", email);
    } else {
      // If user exists, update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: generatedPassword }
      );
      
      if (updateError) {
        console.error("Error updating user password:", updateError);
        throw updateError;
      }
      
      userId = existingUser.id;
      console.log("Updated password for existing user:", email);
    }
    
    // Also save in our client_temp_passwords table for reference
    const { data, error } = await supabaseAdmin
      .from('client_temp_passwords')
      .insert({
        agent_id: agentId,
        email: email,
        temp_password: generatedPassword,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error saving temporary password:", error);
      throw error;
    }

    return { data, password: generatedPassword, userId };
  } catch (error) {
    console.error("Error in saveClientTempPassword:", error);
    throw error;
  }
};
