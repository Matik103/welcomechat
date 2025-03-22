
import { useState } from 'react';
import { ClientAccountForm } from '@/components/client/ClientAccountForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const CreateClientAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      
      // Create client account
      const { data: clientData, error } = await supabase.functions.invoke('create-client-user', {
        body: { 
          email: data.email,
          clientName: data.client_name,
          agentName: data.agent_name,
          tempPassword: data.tempPassword
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success('Client account created successfully');
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
            <ClientAccountForm 
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateClientAccount;
