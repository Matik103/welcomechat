
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/services/clientService';
import type { ClientFormData } from '@/types/client';
import { createOpenAIAssistant } from '@/utils/openAIUtils';

// Form validation schema
const clientFormSchema = z.object({
  client_name: z.string().min(2, 'Client name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  description: z.string().optional(),
  widget_settings: z.object({
    agent_name: z.string().optional(),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional(),
  }).optional(),
  _tempLogoFile: z.any().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface NewClientFormProps {
  onSubmit?: (data: ClientFormData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<ClientFormData>;
}

export function NewClientForm({ onSubmit, isSubmitting = false, initialData }: NewClientFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData?.client_name || '',
      email: initialData?.email || '',
      company: '',
      description: '',
      widget_settings: {
        agent_name: initialData?.widget_settings?.agent_name || '',
        agent_description: initialData?.widget_settings?.agent_description || '',
      },
    },
  });

  const handleSubmit = async (data: ClientFormValues) => {
    // If an external onSubmit handler is provided, use it
    if (onSubmit) {
      try {
        await onSubmit(data as ClientFormData);
      } catch (error) {
        console.error("Error in form submission:", error);
        toast.error(error instanceof Error ? error.message : "An error occurred");
      }
      return;
    }

    // Otherwise, use the default implementation
    setIsLoading(true);
    try {
      // Ensure required fields are present for the ClientFormData type
      const formData: ClientFormData = {
        client_name: data.client_name, // Required field
        email: data.email, // Required field
        company: data.company,
        description: data.description,
        widget_settings: data.widget_settings || {
          agent_name: '',
          agent_description: '',
        }
      };
      
      // Create the client
      const clientId = await createClient(formData);
      
      // Create OpenAI assistant with the client's chatbot settings
      if (formData.widget_settings?.agent_name || formData.widget_settings?.agent_description) {
        try {
          await createOpenAIAssistant(
            clientId,
            formData.widget_settings?.agent_name || "AI Assistant",
            formData.widget_settings?.agent_description || "",
            formData.client_name
          );
        } catch (openaiError) {
          console.error("Error creating OpenAI assistant:", openaiError);
          // We continue even if OpenAI assistant creation fails
        }
      }
      
      toast.success('Client created successfully!');
      form.reset();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="client_name">Client Name *</Label>
          <Input
            id="client_name"
            {...form.register('client_name')}
            placeholder="Enter client name"
            disabled={isLoading || isSubmitting}
          />
          {form.formState.errors.client_name && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.client_name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder="Enter email address"
            disabled={isLoading || isSubmitting}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            {...form.register('company')}
            placeholder="Enter company name"
            disabled={isLoading || isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Enter client description"
            disabled={isLoading || isSubmitting}
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">Chatbot Settings (Optional)</h3>
          
          <div>
            <Label htmlFor="agent_name">Chatbot Name</Label>
            <Input
              id="agent_name"
              {...form.register('widget_settings.agent_name')}
              placeholder="Enter chatbot name"
              disabled={isLoading || isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="agent_description">Chatbot Description</Label>
            <Textarea
              id="agent_description"
              {...form.register('widget_settings.agent_description')}
              placeholder="Enter chatbot description"
              disabled={isLoading || isSubmitting}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading || isSubmitting}>
        {isLoading || isSubmitting ? 'Creating...' : 'Create Client'}
      </Button>
    </form>
  );
}
