
/**
 * Generates a temporary password for client accounts
 * Using the format "Welcome{YEAR}#{RANDOM}" that meets Supabase Auth requirements:
 * - At least 8 characters
 * - Contains at least one uppercase letter (Welcome)
 * - Contains at least one lowercase letter (elcome)
 * - Contains at least one number (2024, 123)
 * - Contains at least one special character (#)
 * 
 * @returns A randomly generated temporary password
 */
export const generateClientTempPassword = (): string => {
  const currentYear = new Date().getFullYear();
  // Generate random digits between 100-999 to ensure 3 digits
  const randomDigits = Math.floor(Math.random() * 900) + 100; 
  
  return `Welcome${currentYear}#${randomDigits}`;
};

/**
 * This function is maintained for backward compatibility
 * but internally uses the standardized Welcome format
 * @returns A randomly generated secure password
 */
export const generateSecurePassword = (): string => {
  return generateClientTempPassword();
};

/**
 * Save a client's temporary password in the database.
 * 
 * @param agentId - The agent ID associated with the client
 * @param email - The client's email address
 * @param tempPassword - The temporary password to save
 * @returns A promise that resolves when the operation is complete
 */
export const saveClientTempPassword = async (
  agentId: string, 
  email: string, 
  tempPassword: string
): Promise<void> => {
  try {
    // Import here to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('client_temp_passwords')
      .insert({
        agent_id: agentId,
        email: email,
        temp_password: tempPassword
      });
      
    if (error) {
      console.error('Error saving client temp password:', error);
      throw new Error(error.message);
    }
    
    console.log(`Temporary password saved for agent ${agentId}, email ${email}`);
  } catch (err) {
    console.error('Failed to save client temp password:', err);
    throw err;
  }
};

/**
 * Create a Supabase Auth user account for a client.
 * 
 * @param email - The client's email address
 * @param clientId - The client ID to store in user metadata
 * @param clientName - The client's name
 * @param agentName - The agent's name
 * @param agentDescription - The agent's description
 * @param tempPassword - The temporary password to set
 * @returns A promise that resolves to the result of the operation
 */
export const createClientUserAccount = async (
  email: string,
  clientId: string,
  clientName: string,
  agentName: string,
  agentDescription: string,
  tempPassword: string
): Promise<any> => {
  try {
    // Import here to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call the edge function to create the user
    const { data, error } = await supabase.functions.invoke(
      'create-client-user',
      {
        body: {
          email,
          client_id: clientId,
          client_name: clientName,
          agent_name: agentName,
          agent_description: agentDescription,
          temp_password: tempPassword
        }
      }
    );
    
    if (error) {
      console.error('Error creating client user account:', error);
      throw new Error(error.message);
    }
    
    console.log('Client user account created successfully:', data);
    return data;
  } catch (err) {
    console.error('Failed to create client user account:', err);
    throw err;
  }
};

/**
 * Generate a client welcome email template.
 * 
 * @param clientName - The client's name
 * @param email - The client's email address
 * @param tempPassword - The temporary password for login
 * @returns The HTML template for the welcome email
 */
export const generateClientWelcomeEmailTemplate = (
  clientName: string,
  email: string,
  tempPassword: string
): string => {
  const currentYear = new Date().getFullYear();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Welcome.Chat, ${clientName}!</h2>
      <p>Your AI assistant account has been created successfully.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Login Information:</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p style="font-size: 12px; color: #777;">Please keep this password secure and change it after your first login.</p>
      </div>
      <p>To access your account, please visit:</p>
      <p><a href="${window.location.origin}/auth" style="color: #0066cc;">${window.location.origin}/auth</a></p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The Welcome.Chat Team</p>
      <div style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee;">
        <p>&copy; ${currentYear} Welcome.Chat. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Log client creation activity in the database.
 * 
 * @param clientId - The client ID 
 * @param clientName - The client's name
 * @param email - The client's email address
 * @param agentName - The agent's name
 * @returns A promise that resolves when the operation is complete
 */
export const logClientCreationActivity = async (
  clientId: string,
  clientName: string,
  email: string,
  agentName: string
): Promise<void> => {
  try {
    // Import here to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: "client_created",
      description: "New client created with AI agent: " + agentName,
      metadata: {
        client_name: clientName,
        email: email,
        agent_name: agentName
      }
    });
    
    if (error) {
      console.error('Error logging client creation activity:', error);
      throw new Error(error.message);
    }
    
    console.log(`Client creation activity logged for ${clientId}`);
  } catch (err) {
    console.error('Failed to log client creation activity:', err);
    // Don't throw here - activity logging is not critical
  }
};
