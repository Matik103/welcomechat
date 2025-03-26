
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientForm } from '@/components/client/ClientForm';
import { useNewClientMutation } from '@/hooks/useNewClientMutation';
import { useNavigation } from '@/hooks/useNavigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Define client form schema
const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  description: z.string().optional(),
  widget_settings: z.object({
    agent_name: z.string().optional(),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional()
  }).optional(),
  _tempLogoFile: z.any().optional()
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export default function NewClient() {
  const { goToClientDashboard } = useNavigation();
  const mutation = useNewClientMutation();
  
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

  const handleSubmit = async (data: ClientFormData) => {
    try {
      await mutation.mutateAsync(data);
      goToClientDashboard();
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={goToClientDashboard}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Client</h1>
        
        <ClientForm 
          form={form}
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
        />
      </div>
    </div>
  );
}
