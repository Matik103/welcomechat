import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Client } from "@/types/client";
import { Label } from "@/components/ui/label";

export interface ClientFormProps {
  client?: Client;
  isLoading: boolean;
  error?: Error | null;
  onSubmit: (data: { client_name: string; email: string; agent_name: string; }) => Promise<void>;
  isClientView?: boolean;
  onSendInvitation?: () => Promise<void>;
  isSendingInvitation?: boolean;
}

const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().min(1, "Agent name is required"),
});

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  isLoading,
  error,
  onSubmit,
  isClientView = false,
  onSendInvitation,
  isSendingInvitation = false
}) => {
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: client?.name || '',
      email: client?.email || '',
      agent_name: client ? `${client.name} Agent` : '',
    },
  });

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      await onSubmit(formState => ({
        client_name: formState.client_name,
        email: formState.email,
        agent_name: formState.agent_name,
      }));
      if (!client) {
        // Only reset form for new clients
        reset({
          client_name: '',
          email: '',
          agent_name: '',
        });
      }
    } catch (err) {
      toast.error('Failed to submit form');
    }
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="client_name" className="text-sm font-medium text-gray-900">
          Client Name
        </Label>
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
        <Label htmlFor="email" className="text-sm font-medium text-gray-900">
          Email Address
        </Label>
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
        <Label htmlFor="agent_name" className="text-sm font-medium text-gray-900">
          AI Agent Name
        </Label>
        <Input
          id="agent_name"
          {...register("agent_name")}
          className={errors.agent_name ? "border-red-500" : ""}
        />
        {errors.agent_name && (
          <p className="text-sm text-red-500">{errors.agent_name.message}</p>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isClientView 
            ? "Save Changes"
            : client 
              ? "Update Client" 
              : "Create Client"}
        </Button>
        
        {client && onSendInvitation && !isClientView && (
          <Button
            type="button"
            variant="outline"
            onClick={onSendInvitation}
            disabled={isSendingInvitation}
          >
            {isSendingInvitation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invitation Email
          </Button>
        )}
      </div>
    </form>
  );
};
