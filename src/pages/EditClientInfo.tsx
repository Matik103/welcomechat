
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientForm } from '@/components/client/ClientForm';
import { useClientForm } from '@/hooks/useClientForm';
import { useClientFormSubmission } from '@/hooks/useClientFormSubmission';
import { Loader2, ArrowLeft } from 'lucide-react';
import { logActivity } from '@/services/clientActivityService';
import { toast } from 'sonner';

export default function EditClientInfoPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get client data
  const {
    formData,
    isLoading: isLoadingForm,
    error: formError,
    setFormData
  } = useClientForm(clientId || '');
  
  // Form submission handler
  const {
    handleSubmit: submitClientForm,
    isSubmitting: isSubmittingForm,
    error: submitError
  } = useClientFormSubmission(true, (savedClientId) => {
    toast.success('Client updated successfully');
    navigate(`/admin/clients/view/${savedClientId}`);
  }, clientId);
  
  // Combined loading state
  const isLoading = isLoadingForm || isSubmittingForm || isSubmitting;
  
  // Handle form submission
  const handleSubmit = async (data: any) => {
    if (!clientId) return;
    
    setIsSubmitting(true);
    
    try {
      // Log activity
      await logActivity('client_updated', `Client ${data.client_name} was updated`);
      
      // Submit form
      await submitClientForm(data);
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate(`/admin/clients/view/${clientId}`);
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  // Error state
  if (formError) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={goBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error loading client: {formError}</p>
              <Button onClick={goBack}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={goBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Client Information</h1>
      </div>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ClientForm 
              formData={formData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              error={submitError}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
