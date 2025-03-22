
import { useState } from 'react';
import { ClientFormData } from '@/types/client-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NewClientForm } from '@/components/client/NewClientForm';
import { createClient } from '@/services/clientService';

const CreateClientAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);
      const loadingToastId = toast.loading("Creating client account...");
      
      // Use the createClient service to create the client
      const clientId = await createClient(data);
      
      // If client was created successfully, send welcome email
      if (clientId) {
        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        
        // Call the edge function to send the welcome email
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-welcome-email', 
          {
            body: {
              clientId: clientId,
              clientName: data.client_name,
              email: data.email,
              agentName: data.widget_settings?.agent_name || "AI Assistant",
              tempPassword: tempPassword
            }
          }
        );
        
        if (emailError) {
          console.error("Email sending error:", emailError);
          toast.error(`Client created but welcome email failed: ${emailError.message}`, {
            id: loadingToastId,
            duration: 6000
          });
        } else if (emailResult && !emailResult.success) {
          console.error("Email sending failed:", emailResult.error);
          toast.error(`Client created but welcome email failed: ${emailResult.error || "Unknown error"}`, {
            id: loadingToastId,
            duration: 6000
          });
        } else {
          toast.success("Client created successfully and welcome email sent", {
            id: loadingToastId
          });
        }
      } else {
        toast.error("Failed to create client", { id: loadingToastId });
      }
      
      // Navigate back to clients list
      navigate('/admin/clients');
    } catch (error: any) {
      console.error('Error creating client account:', error);
      toast.error(error.message || 'Failed to create client account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Client Account</CardTitle>
          </CardHeader>
          <CardContent>
            <NewClientForm 
              onSubmit={handleSubmit}
              isSubmitting={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateClientAccount;
