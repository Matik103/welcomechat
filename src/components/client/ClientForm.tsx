
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Client } from "@/types/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: { 
    client_name: string; 
    email: string; 
    agent_name?: string; 
    agent_description?: string 
  }) => Promise<void>;
  isLoading?: boolean;
  isClientView?: boolean;
}

const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().optional(),
  agent_description: z.string().optional(),
});

export const ClientForm = ({ 
  initialData, 
  onSubmit, 
  isLoading = false, 
  isClientView = false
}: ClientFormProps) => {
  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: initialData?.agent_name || "",
      agent_description: initialData?.agent_description || "",
    },
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: initialData.agent_name || "",
        agent_description: initialData.agent_description || "",
      });
    }
  }, [initialData, reset]);

  // Watch for agent name changes to validate and clean any potential " Assistant" suffix
  const agentName = watch("agent_name");
  
  useEffect(() => {
    if (agentName && agentName.endsWith(" Assistant")) {
      // Automatically remove the " Assistant" suffix
      setValue("agent_name", agentName.substring(0, agentName.length - 10));
    }
  }, [agentName, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="client_name" className="text-sm font-medium text-gray-900">
          Client Name <span className="text-red-500">*</span>
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
          Email Address <span className="text-red-500">*</span>
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
          AI Agent Name {isClientView && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="agent_name"
          {...register("agent_name")}
          className={errors.agent_name ? "border-red-500" : ""}
        />
        {errors.agent_name && (
          <p className="text-sm text-red-500">{errors.agent_name.message}</p>
        )}
        {!isClientView && (
          <p className="text-xs text-gray-500 mt-1">Optional - client can set this later</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent_description" className="text-sm font-medium text-gray-900">
          AI Agent Description {isClientView && <span className="text-red-500">*</span>}
        </Label>
        <Textarea
          id="agent_description"
          {...register("agent_description")}
          className={errors.agent_description ? "border-red-500" : ""}
          placeholder="Describe the purpose and capabilities of this AI agent"
          rows={4}
        />
        {errors.agent_description && (
          <p className="text-sm text-red-500">{errors.agent_description.message}</p>
        )}
        {!isClientView && (
          <p className="text-xs text-gray-500 mt-1">Optional - client can set this later</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isClientView 
            ? "Save Changes"
            : initialData 
              ? "Update Client" 
              : "Create Client"}
        </Button>
      </div>
    </form>
  );
};
