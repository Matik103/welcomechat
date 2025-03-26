
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientForm } from '@/components/client/ClientForm';
import { useClient } from '@/hooks/useClient';
import { useClientMutation } from '@/hooks/useClientMutation';
import { ClientFormData } from '@/types/client-form';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export default function AddEditClient() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  
  const { client, isLoading: isClientLoading } = useClient(id || '');
  const { updateClient, createClient } = useClientMutation(id);
  
  const [formValues, setFormValues] = useState<ClientFormData>({
    client_name: '',
    email: '',
    company: '',
    description: '',
    widget_settings: {
      agent_name: '',
      agent_description: '',
      logo_url: '',
      logo_storage_path: ''
    }
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (client && isEditMode) {
      setFormValues({
        client_id: client.id,
        client_name: client.client_name || '',
        email: client.email || '',
        company: client.company || '',
        description: client.description || '',
        widget_settings: {
          agent_name: client.agent_name || '',
          agent_description: client.agent_description || '',
          logo_url: client.logo_url || '',
          logo_storage_path: client.logo_storage_path || ''
        }
      });
    }
  }, [client, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [group, field] = name.split('.');
      setFormValues(prev => ({
        ...prev,
        [group]: {
          ...prev[group],
          [field]: value
        }
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormValues(prev => ({
        ...prev,
        _tempLogoFile: e.target.files![0]
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formValues.client_name) {
      newErrors.client_name = 'Client name is required';
    }
    
    if (!formValues.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (isEditMode) {
        await updateClient(formValues);
        toast.success('Client updated successfully');
      } else {
        await createClient(formValues);
        toast.success('Client created successfully');
      }
      
      navigate('/admin/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Failed to save client');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isClientLoading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Client' : 'Add New Client'}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            formValues={formValues}
            errors={errors}
            isSubmitting={isSubmitting}
            onChange={handleInputChange}
            onLogoChange={handleLogoChange}
            onSubmit={handleSubmit}
            isClientView={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
