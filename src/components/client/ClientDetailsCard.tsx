
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientForm } from '@/hooks/useClientForm';
import { useClientFormSubmission } from '@/hooks/useClientFormSubmission';
import { ClientFormData } from '@/types/client-form';

interface ClientDetailsCardProps {
  clientId: string;
  isEditMode?: boolean;
  onEdit?: () => void;
}

export const ClientDetailsCard = ({ clientId, isEditMode = false, onEdit }: ClientDetailsCardProps) => {
  const {
    formData,
    isLoading: formLoading,
    error: formError
  } = useClientForm(clientId, !isEditMode);
  
  const {
    handleSubmit: submitForm,
    isSubmitting: isSubmitting,
    error: submitError
  } = useClientFormSubmission(true, undefined, clientId);

  const handleSubmit = async (data: ClientFormData) => {
    await submitForm(data);
  };

  if (formLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (formError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading client: {formError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Client Information</CardTitle>
        {!isEditMode && onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-gray-500 hover:text-primary">
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-700">Client Name</h3>
          <p className="text-gray-900">{formData?.client_name || 'N/A'}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-700">Email</h3>
          <p className="text-gray-900">{formData?.email || 'N/A'}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-700">Agent Name</h3>
          <p className="text-gray-900">{formData?.agent_name || 'N/A'}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-700">Agent Description</h3>
          <p className="text-gray-900">{formData?.agent_description || 'No description provided'}</p>
        </div>
      </CardContent>
    </Card>
  );
};
