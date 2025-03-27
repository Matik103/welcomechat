import React, { useState } from 'react';
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
import { ClientFormData, clientFormSchema } from '@/types/client-form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
        widget_settings: data.widget_settings
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
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData.client_name || "",
      email: initialData.email || "",
      widget_settings: {
        agent_name: initialData.name || initialData.agent_name || 
                   (initialData.widget_settings?.agent_name) || "",
        agent_description: initialData.agent_description || 
                         (initialData.widget_settings?.agent_description) || ""
      },
      client_id: initialData.client_id,
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
        <Label htmlFor="widget_settings.agent_name">Agent Name</Label>
        <Input
          id="widget_settings.agent_name"
          {...register("widget_settings.agent_name")}
          className={errors.widget_settings?.agent_name ? "border-red-500" : ""}
        />
        {errors.widget_settings?.agent_name && (
          <p className="text-sm text-red-500">{errors.widget_settings.agent_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="widget_settings.agent_description">Agent Description</Label>
        <Textarea
          id="widget_settings.agent_description"
          {...register("widget_settings.agent_description")}
          className={errors.widget_settings?.agent_description ? "border-red-500" : ""}
          rows={4}
        />
        {errors.widget_settings?.agent_description && (
          <p className="text-sm text-red-500">{errors.widget_settings.agent_description.message}</p>
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
