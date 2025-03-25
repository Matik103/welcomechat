
import { useState } from 'react';
import { ClientFormData } from '@/types/client-form';
import { createClient, updateClient } from '@/services/clientService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateTempPassword } from '@/utils/passwordUtils';
import { supabase } from '@/integrations/supabase/client';

export const useClientFormSubmission = (
  isEdit = false,
  onSuccess?: (clientId: string) => void,
  clientId?: string
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && clientId) {
        // Update existing client
        const updatedClient = await updateClient(clientId, data);
        
        toast.success('Client updated successfully');
        if (onSuccess) {
          onSuccess(clientId);
        } else {
          navigate(`/admin/clients/view/${clientId}`);
        }
        
        return updatedClient;
      } else {
        // Create new client
        const newClient = await createClient(data);
        const clientId = newClient?.id;
        
        if (clientId) {
          const tempPassword = generateTempPassword();
          
          // Only create client user if there's an email
          if (data.email) {
            try {
              // Store temporary password in the database
              const { error: tempPasswordError } = await supabase
                .from('client_temp_passwords')
                .insert({
                  agent_id: clientId,
                  email: data.email,
                  temp_password: tempPassword,
                });
                
              if (tempPasswordError) {
                throw tempPasswordError;
              }
              
              // Send client user invitation with Edge Function
              await supabase.functions.invoke('create-client-user', {
                body: { 
                  email: data.email,
                  client_id: clientId,
                  client_name: data.client_name,
                  password: tempPassword
                }
              });
            } catch (err) {
              console.error('Error creating client user:', err);
              // Continue even if user creation fails - admin can retry later
              toast.error('Client created but user account setup failed. You can retry this later.');
            }
          }
          
          toast.success('Client created successfully');
          
          if (onSuccess) {
            onSuccess(clientId);
          } else {
            navigate(`/admin/clients/view/${clientId}`);
          }
        }
        
        return newClient;
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unknown error occurred';
      
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      console.error('Error submitting client form:', err);
      
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    error
  };
};
