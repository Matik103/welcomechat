
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Client } from "@/types/client";
import { AgentDescriptionField } from "./form-fields/AgentDescriptionField";
import { v4 as uuidv4 } from 'uuid';

interface ClientAccountFormProps {
  initialData?: Client | null;
  onSubmit: (data: { client_name: string; email: string; agent_name: string; agent_description: string; client_id: string }) => Promise<void>;
  isLoading?: boolean;
}

const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().min(1, "Agent name is required"),
  agent_description: z.string().optional(),
  client_id: z.string().optional(), // Add client_id to schema
});

export function ClientAccountForm({ initialData, onSubmit, isLoading = false }: ClientAccountFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: initialData?.name || initialData?.agent_name || (initialData?.widget_settings && initialData.widget_settings.agent_name) || "",
      agent_description: initialData?.agent_description || (initialData?.widget_settings && initialData.widget_settings.agent_description) || "",
      client_id: initialData?.client_id || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("client_name", initialData.client_name || "");
      setValue("email", initialData.email || "");
      setValue("agent_name", initialData.name || initialData.agent_name || 
        (initialData.widget_settings && initialData.widget_settings.agent_name) || "");
      setValue("agent_description", initialData.agent_description || 
        (initialData.widget_settings && initialData.widget_settings.agent_description) || "");
      setValue("client_id", initialData.client_id || "");
    }
  }, [initialData, setValue]);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.logo_url || (initialData?.widget_settings && initialData.widget_settings.logo_url) || null
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === 'string' ? reader.result : null;
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (data: any) => {
    // Generate a new client_id if one doesn't exist
    if (!data.client_id) {
      data.client_id = uuidv4();
      console.log("Generated new client_id in ClientAccountForm:", data.client_id);
    }
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Hidden field for client_id */}
      <input type="hidden" {...register("client_id")} />
      
      <div className="space-y-2">
        <label htmlFor="client_name" className="text-sm font-medium text-gray-900">
          Client Name
        </label>
        <Input
          id="client_name"
          {...register("client_name")}
          className={errors.client_name ? "border-red-500" : ""}
        />
        {errors.client_name && (
          <p className="text-sm text-red-500">{errors.client_name.message?.toString()}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-900">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message?.toString()}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="agent_name" className="text-sm font-medium text-gray-900">
          AI Agent Name
        </label>
        <Input
          id="agent_name"
          {...register("agent_name")}
          className={errors.agent_name ? "border-red-500" : ""}
        />
        {errors.agent_name && (
          <p className="text-sm text-red-500">{errors.agent_name.message?.toString()}</p>
        )}
      </div>

      <AgentDescriptionField form={{ register, formState: { errors } }} />

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
