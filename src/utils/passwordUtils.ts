
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
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('client_temp_passwords')
      .insert({
        agent_id: agentId,
        email: email,
        temp_password: tempPassword || generateTempPassword(),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error saving temporary password:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in saveClientTempPassword:", error);
    throw error;
  }
};
