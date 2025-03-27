
import React from 'react';
import { useClientData } from '@/hooks/useClientData';
import { useParams } from 'react-router-dom';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Define a simpler client form schema
const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  agent_name: z.string().min(1, "Agent name is required").optional(),
  agent_description: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

export function EditClientInfo() {
  const { id } = useParams<{ id: string }>();
  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    clientId,
    refetchClient
  } = useClientData(id);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      await clientMutation.mutateAsync({
        client_id: clientId,
        client_name: data.client_name,
        email: data.email,
        widget_settings: {
          agent_name: data.agent_name,
          agent_description: data.agent_description
        }
      });
      
      if (clientId) {
        console.log(`[ACTIVITY LOG]: Updated client information`, {
          clientId,
          activityType: 'client_updated',
          fields_updated: Object.keys(data),
          timestamp: new Date().toISOString()
        });
      }
      
      toast.success("Client information updated successfully");
      refetchClient();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client information");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeading>
        Edit Client Information
        <p className="text-sm font-normal text-muted-foreground">
          Update client details and settings
        </p>
      </PageHeading>

      <div className="mt-6">
        <ClientForm 
          initialData={client}
          onSubmit={handleSubmit}
          isLoading={isLoadingClient || clientMutation.isPending}
          error={error ? (error instanceof Error ? error.message : String(error)) : null}
          submitButtonText="Update Client"
        />
      </div>
    </div>
  );
}

interface ClientFormProps {
  initialData?: any;
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  submitButtonText?: string;
}

function ClientForm({
  initialData = {},
  onSubmit,
  isLoading = false,
  error = null,
  submitButtonText = "Save Changes"
}: ClientFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData.client_name || "",
      email: initialData.email || "",
      agent_name: initialData.name || initialData.agent_name || 
                 (initialData.widget_settings?.agent_name) || "",
      agent_description: initialData.agent_description || 
                       (initialData.widget_settings?.agent_description) || ""
    },
  });

  const handleFormSubmit = async (data: ClientFormData) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="client_name">Client Name</Label>
        <Input
          id="client_name"
          {...register("client_name")}
          className={errors.client_name ? "border-red-500" : ""}
        />
        {errors.client_name && (
          <p className="text-sm text-red-500">{errors.client_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent_name">Agent Name</Label>
        <Input
          id="agent_name"
          {...register("agent_name")}
          className={errors.agent_name ? "border-red-500" : ""}
        />
        {errors.agent_name && (
          <p className="text-sm text-red-500">{errors.agent_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent_description">Agent Description</Label>
        <Textarea
          id="agent_description"
          {...register("agent_description")}
          className={errors.agent_description ? "border-red-500" : ""}
          rows={4}
        />
        {errors.agent_description && (
          <p className="text-sm text-red-500">{errors.agent_description.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || submitting}>
          {(isLoading || submitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}

export default EditClientInfo;
