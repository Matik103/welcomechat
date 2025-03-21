
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { ClientFormData } from '@/types/client-form';

// Form validation schema
const clientFormSchema = z.object({
  client_name: z.string().min(2, 'Client name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  widget_settings: z.object({
    agent_name: z.string().optional(),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
  }).optional(),
});

interface NewClientFormProps {
  onSubmit?: (data: ClientFormData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<ClientFormData>;
}

export function NewClientForm({ onSubmit, isSubmitting = false, initialData }: NewClientFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData?.client_name || '',
      email: initialData?.email || '',
      widget_settings: {
        agent_name: initialData?.widget_settings?.agent_name || '',
        agent_description: initialData?.widget_settings?.agent_description || '',
        logo_url: initialData?.widget_settings?.logo_url || '',
      },
    },
  });

  const handleSubmit = async (data: any) => {
    if (isLoading || isSubmitting) {
      return; // Prevent multiple submissions
    }
    
    // If an external onSubmit handler is provided, use it
    if (onSubmit) {
      try {
        setIsLoading(true);
        console.log("Submitting form with data:", data);
        await onSubmit(data as ClientFormData);
        console.log("Form submission successful");
      } catch (error) {
        console.error("Error in form submission:", error);
        toast.error(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Default implementation if no external handler is provided
    setIsLoading(true);
    try {
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

      <Button 
        type="submit" 
        disabled={isLoading || isSubmitting}
        className="w-full md:w-auto"
      >
        {isLoading || isSubmitting ? 'Creating...' : 'Create Client'}
      </Button>
    </form>
  );
}
