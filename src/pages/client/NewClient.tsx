
import React from 'react';
import { NewClientForm } from '@/components/client/NewClientForm';
import { useClientFormSubmission } from '@/hooks/useClientFormSubmission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function NewClientPage() {
  const navigate = useNavigate();
  
  const {
    handleSubmit,
    isSubmitting,
    error
  } = useClientFormSubmission(false, (clientId) => {
    navigate(`/admin/clients/view/${clientId}`);
  });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Client</h1>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <NewClientForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
