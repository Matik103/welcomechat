
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Client } from "@/types/client";
import { useClientData } from "@/hooks/useClientData";
import { Label } from "@/components/ui/label";

interface EditFormProps {
  initialData?: Client | null;
  onSubmit: (data: { client_name: string; email: string; agent_name: string }) => Promise<void>;
  isLoading?: boolean;
}

const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().min(1, "Agent name is required")
    .refine(name => !name.includes('"'), { message: 'Agent name cannot include double quotes (")' })
    .transform(name => name.replace(/"/g, '')), // Remove any quotes if they slip through
});

export function EditForm({ initialData, onSubmit, isLoading = false }: EditFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: initialData?.agent_name || "",
    },
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      setValue("client_name", initialData.client_name || "");
      setValue("email", initialData.email || "");
      // Sanitize agent_name to remove quotes
      setValue("agent_name", initialData.agent_name ? initialData.agent_name.replace(/"/g, '') : "");
    }
  }, [initialData, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          onChange={(e) => {
            // Remove quotes on input change
            e.target.value = e.target.value.replace(/"/g, '');
          }}
        />
        {errors.agent_name && (
          <p className="text-sm text-red-500">{errors.agent_name.message}</p>
        )}
        <p className="text-xs text-gray-500">Please avoid using quotes (") in the agent name.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
