
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ClientForm } from '@/components/client/ClientForm';
import { useNewClientMutation } from '@/hooks/useNewClientMutation';
import { ClientFormData } from '@/types/client-form';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function NewClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createClient, isLoading, error } = useNewClientMutation();
  
  const handleSubmit = async (data: ClientFormData) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Show loading toast
      toast.loading('Creating client account...');
      
      const result = await createClient({
        ...data,
        adminId: user?.id
      });
      
      // Dismiss all toasts
      toast.dismiss();
      
      if (result.success) {
        // Success toast
        toast.success('Client account created successfully!');
        
        // Navigate to the client view
        setTimeout(() => {
          navigate(`/admin/clients/view/${result.clientId}`);
        }, 1500);
      } else {
        // Error toast
        toast.error(result.message || 'Failed to create client account');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      
      // Dismiss loading toast
      toast.dismiss();
      
      // Show error toast
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Client</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            onSubmit={handleSubmit}
            isLoading={isLoading || isSubmitting}
            error={error?.message}
          />
        </CardContent>
      </Card>
    </div>
  );
}
