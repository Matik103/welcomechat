
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Client } from "@/types/client";
import { ClientFormData } from "@/types/client-form";
import { Loader2 } from "lucide-react";

interface ClientFormProps {
  initialData?: Partial<Client>;
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  submitButtonText?: string;
}

// Form schema for validation
const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().min(1, "Agent name is required"),
  agent_description: z.string().optional(),
  client_id: z.string().optional(),
});

export function ClientForm({
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
      agent_name: initialData.name || initialData.agent_name || "",
      agent_description: initialData.agent_description || "",
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
