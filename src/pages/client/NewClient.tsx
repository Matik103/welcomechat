
import React, { useState } from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientForm } from '@/components/client/ClientForm';
import { useNewClientForm } from '@/hooks/useNewClientForm';
import { useNewClientMutation } from '@/hooks/useNewClientMutation';
import { useNavigation } from '@/hooks/useNavigation';
import { ClientFormData } from '@/types/client-form';
import { toast } from 'sonner';

export default function NewClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const { formValues, errors, handleInputChange, handleLogoChange, validateForm } = useNewClientForm(true);
  const { createClient } = useNewClientMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newClient = await createClient(formValues as ClientFormData);
      
      // Check if client was created successfully
      if (newClient && newClient.client_id) {
        toast.success('Client created successfully!');
        // Redirect to client dashboard or client list
        navigation.goToClientDashboard();
      } else {
        toast.error('Failed to create client. Please try again.');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error(`Error creating client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientLayout>
      <div className="container mx-auto py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Create a New Client</CardTitle>
            <CardDescription>
              Fill in the details to create a new client and AI assistant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientForm
              formValues={formValues}
              errors={errors}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onChange={handleInputChange}
              onLogoChange={handleLogoChange}
              isClientView={true}
            />
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
