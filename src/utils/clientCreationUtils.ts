
import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a temporary password for new client accounts
 * @returns A randomly generated password string
 */
export function generateTempPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Saves a temporary password for a client
 * @param clientId The client's ID
 * @param email The client's email address
 * @param password The temporary password to save
 */
export async function saveClientTempPassword(
  clientId: string,
  email: string,
  password: string
): Promise<void> {
  try {
    // First check if the table exists
    const { data: tableExistsData, error: tableExistsError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'client_temp_passwords'
          ) as exists
        `
      });
    
    if (tableExistsError) {
      console.error("Error checking if table exists:", tableExistsError);
      throw tableExistsError;
    }
    
    const tableExists = Array.isArray(tableExistsData) && 
                         tableExistsData.length > 0 && 
                         tableExistsData[0].exists === true;
    
    if (!tableExists) {
      console.error("client_temp_passwords table does not exist");
      throw new Error("Required database table not found");
    }
    
    // Delete any existing temporary passwords for this client
    const { error: deleteError } = await supabase
      .from('client_temp_passwords')
      .delete()
      .eq('client_id', clientId);
    
    if (deleteError) {
      console.error("Error deleting existing temp password:", deleteError);
      // Continue anyway
    }
    
    // Insert the new temporary password
    const { error: insertError } = await supabase
      .from('client_temp_passwords')
      .insert({
        client_id: clientId,
        email: email,
        temp_password: password,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });
    
    if (insertError) {
      console.error("Error saving temp password:", insertError);
      throw insertError;
    }
    
  } catch (error) {
    console.error("Error in saveClientTempPassword:", error);
    throw error;
  }
}
