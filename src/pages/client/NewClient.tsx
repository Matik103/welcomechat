
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewClientForm } from '@/components/client/NewClientForm';
import { createClient } from '@/services/clientService';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { logClientActivity } from '@/services/activityService';
import { toast } from 'sonner';

export default function NewClient() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      // Create the client
      const result = await createClient({
        client_name: formData.client_name,
        email: formData.email,
        company: formData.company,
        description: formData.description
      });
      
      if (result.success && result.clientId) {
        // Log the activity
        await logClientActivity(
          result.clientId, 
          'client_created',
          `New client created: ${formData.client_name}`
        );
        
        toast.success('Client created successfully!');
        
        // Navigate to the client's page
        navigate(`/client/dashboard/${result.clientId}`);
      } else {
        toast.error('Failed to create client. Please try again.');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('An error occurred while creating the client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Client</h1>
        <NewClientForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </ClientLayout>
  );
}
