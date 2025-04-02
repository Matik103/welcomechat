// Make sure to add the correct import
import { ActivityTypeString } from '@/types/activity';
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches all clients from the database.
 */
export const getAllClients = async () => {
  try {
    const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data, error: null };
  } catch (error: any) {
    console.error("Error fetching clients:", error.message);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Fetches all agents from the database.
 */
export const getAllAgents = async () => {
  try {
    const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching agents:", error);
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data, error: null };
  } catch (error: any) {
    console.error("Error fetching agents:", error.message);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Fetches all users from the database.
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Error fetching users:", error);
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data.users, error: null };
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    return { success: false, data: null, error: error.message };
  }
};
