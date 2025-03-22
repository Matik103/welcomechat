
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientFormData } from '@/types/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const useClientMutation = (clientId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      console.log("Client mutation with data:", data, "for clientId:", clientId);
      
      // Handle temp logo file upload if present
      let logoUrl = data.widget_settings?.logo_url;
      let logoStoragePath = data.widget_settings?.logo_storage_path;
      
      if (data._tempLogoFile) {
        // Generate unique filename
        const filename = `${uuidv4()}-${data._tempLogoFile.name}`;
        const storagePath = `widget-logos/${clientId || 'new'}/${filename}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('widget-logos')
          .upload(storagePath, data._tempLogoFile);
          
        if (uploadError) {
          console.error("Logo upload error:", uploadError);
          throw new Error(`Failed to upload logo: ${uploadError.message}`);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('widget-logos')
          .getPublicUrl(storagePath);
          
        logoUrl = urlData.publicUrl;
        logoStoragePath = storagePath;
        
        // Update widget settings
        if (data.widget_settings) {
          data.widget_settings.logo_url = logoUrl;
          data.widget_settings.logo_storage_path = logoStoragePath;
        } else {
          data.widget_settings = {
            logo_url: logoUrl,
            logo_storage_path: logoStoragePath
          };
        }
      }
      
      // Construct agent settings object
      const agentSettings = {
        ...(data.widget_settings || {}),
        client_name: data.client_name,
        email: data.email,
        updated_at: new Date().toISOString()
      };
      
      if (clientId) {
        // Update existing client in AI agents table
        const { data: updateData, error: updateError } = await supabase
          .from('ai_agents')
          .update({
            name: data.widget_settings?.agent_name || 'AI Assistant',
            agent_description: data.widget_settings?.agent_description || '',
            logo_url: logoUrl,
            logo_storage_path: logoStoragePath,
            settings: agentSettings,
            client_name: data.client_name,
            email: data.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating AI agent:", updateError);
          throw new Error(`Failed to update client: ${updateError.message}`);
        }
        
        console.log("Client updated successfully:", updateData);
        return clientId;
      } else {
        // Create new client in AI agents table
        const { data: insertData, error: insertError } = await supabase
          .from('ai_agents')
          .insert({
            name: data.widget_settings?.agent_name || 'AI Assistant',
            agent_description: data.widget_settings?.agent_description || '',
            logo_url: logoUrl,
            logo_storage_path: logoStoragePath,
            settings: agentSettings,
            client_name: data.client_name,
            email: data.email,
            interaction_type: 'config',
            content: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          console.error("Error creating AI agent:", insertError);
          throw new Error(`Failed to create client: ${insertError.message}`);
        }
        
        console.log("Client created successfully:", insertData);
        return { agentId: insertData.id };
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      toast.success(
        clientId ? "Client updated successfully" : "Client created successfully"
      );
    },
    onError: (error: Error) => {
      console.error("Client mutation error:", error);
      toast.error(`Error: ${error.message}`);
    }
  });
};
