
import { useState } from 'react';
import { ClientAccountForm } from '@/components/client/ClientAccountForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createClientAccount } from '@/services/clientCreationService';

const CreateClientAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      toast.loading('Creating client account and sending welcome email...');
      
      // Use our service to create the client account
      await createClientAccount(data);
      
      toast.dismiss();
      toast.success('Client account created successfully');
      navigate('/admin/clients');
    } catch (error: any) {
      console.error('Error creating client account:', error);
      toast.dismiss();
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
