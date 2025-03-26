
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClientForm } from '@/components/client/ClientForm';
import { useClientMutation } from '@/hooks/useClientMutation';
import { useQuery } from '@tanstack/react-query';
import { getClientById } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Define client form schema
const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  description: z.string().optional(),
  client_id: z.string().optional(),
  widget_settings: z.object({
    agent_name: z.string().optional(),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional()
  }).optional(),
  _tempLogoFile: z.any().optional()
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export default function AddEditClient() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const isEditing = !!clientId;
  const mutation = useClientMutation();
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: '',
      email: '',
      company: '',
      description: '',
      widget_settings: {
        agent_name: 'AI Assistant',
        agent_description: ''
      }
    }
  });

  // Fetch client data if editing
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientId ? getClientById(clientId) : null,
    enabled: isEditing,
  });

  // Populate form when client data is loaded
  useEffect(() => {
    if (client) {
      form.reset({
        client_name: client.client_name,
        email: client.email,
        company: client.company || '',
        description: client.description || '',
        client_id: client.id,
        widget_settings: {
          agent_name: client.agent_name || 'AI Assistant',
          agent_description: client.agent_description || '',
          logo_url: client.logo_url || '',
          logo_storage_path: client.logo_storage_path || ''
        }
      });
    }
  }, [client, form]);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      await mutation.mutateAsync({
        ...data,
        client_id: isEditing ? clientId : undefined
      });
      
      navigate('/admin/clients');
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleBack = () => {
    navigate('/admin/clients');
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditing ? 'Edit Client' : 'Add New Client'}
        </h1>
        
        {isLoadingClient && isEditing ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          </div>
        ) : (
          <ClientForm 
            form={form}
            onSubmit={handleSubmit}
            isSubmitting={mutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
