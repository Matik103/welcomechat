
import { supabase } from '@/integrations/supabase/client';
import { sendWelcomeEmail } from '@/utils/emailUtils';
import { v4 as uuidv4 } from 'uuid';

// Upload logo and get public URL
const uploadLogo = async (logoFile: File, clientId: string): Promise<{ url: string, path: string } | null> => {
  if (!logoFile) return null;
  
  try {
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${clientId}_${uuidv4()}.${fileExt}`;
    const filePath = `${clientId}/logos/${fileName}`;
    
    // Upload the file to client_documents bucket
    const { error: uploadError } = await supabase.storage
      .from('client_documents')
      .upload(filePath, logoFile);
      
    if (uploadError) {
      console.error('Logo upload error:', uploadError);
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from('client_documents')
      .getPublicUrl(filePath);
      
    return {
      url: data.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Logo processing error:', error);
    return null;
  }
};

// Create a client account with all details
export const createClientAccount = async (formData: any): Promise<string> => {
  try {
    // First, create the user account via the edge function
    const { data: userData, error: userError } = await supabase.functions.invoke('create-client-user', {
      body: {
        email: formData.email,
        clientName: formData.client_name,
        agentName: formData.agent_name || 'AI Assistant',
        tempPassword: formData.tempPassword
      }
    });
    
    if (userError) {
      throw new Error(`User creation failed: ${userError.message}`);
    }
    
    console.log('Client user created:', userData);
    
    // If client was created successfully, we'll have a client_id
    const clientId = userData.clientId || userData.client_id;
    
    if (!clientId) {
      throw new Error('No client ID returned from user creation');
    }
    
    // Handle logo upload if a file was provided
    let logoUrl = null;
    let logoPath = null;
    
    if (formData._tempLogoFile) {
      const logoResult = await uploadLogo(formData._tempLogoFile, clientId);
      if (logoResult) {
        logoUrl = logoResult.url;
        logoPath = logoResult.path;
      }
    }
    
    // Update AI agent with additional details
    const { error: agentError } = await supabase
      .from('ai_agents')
      .update({
        agent_description: formData.agent_description || '',
        logo_url: logoUrl,
        logo_storage_path: logoPath,
        settings: {
          agent_name: formData.agent_name || 'AI Assistant',
          agent_description: formData.agent_description || '',
          logo_url: logoUrl,
          logo_storage_path: logoPath
        }
      })
      .eq('client_id', clientId);
      
    if (agentError) {
      console.error('Error updating AI agent:', agentError);
      // Continue anyway, as the core account was created
    }
    
    // Send welcome email
    const emailResult = await sendWelcomeEmail(
      formData.email,
      formData.client_name,
      formData.tempPassword
    );
    
    if (!emailResult.emailSent) {
      console.warn('Warning: Welcome email could not be sent:', emailResult.emailError);
      // Continue anyway, as the account was created
    }
    
    return clientId;
  } catch (error: any) {
    console.error('Client account creation error:', error);
    throw new Error(error.message || 'Failed to create client account');
  }
};
