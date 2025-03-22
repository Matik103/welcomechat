
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Client } from "@/types/client";

interface ClientAccountFormProps {
  initialData?: Client | null;
  onSubmit: (data: { client_name: string; email: string; agent_name: string; agent_description: string }) => Promise<void>;
  isLoading?: boolean;
}

const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().min(1, "Agent name is required"),
  agent_description: z.string().optional(),
});

export function ClientAccountForm({ initialData, onSubmit, isLoading = false }: ClientAccountFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: initialData?.name || initialData?.agent_name || initialData?.widget_settings?.agent_name || "",
      agent_description: initialData?.description || initialData?.agent_description || 
        (initialData?.widget_settings && initialData?.widget_settings.agent_description) || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("client_name", initialData.client_name || "");
      setValue("email", initialData.email || "");
      setValue("agent_name", initialData.name || initialData.agent_name || 
        (initialData.widget_settings && initialData.widget_settings.agent_name) || "");
      setValue("agent_description", initialData.description || initialData.agent_description || 
        (initialData.widget_settings && initialData.widget_settings.agent_description) || "");
    }
  }, [initialData, setValue]);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.logo_url || initialData?.widget_settings?.logo_url || null
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <p className="text-sm text-red-500">{errors.client_name.message}</p>
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
          <p className="text-sm text-red-500">{errors.email.message}</p>
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
          <p className="text-sm text-red-500">{errors.agent_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="agent_description" className="text-sm font-medium text-gray-900">
          Chatbot Description
        </label>
        <Textarea
          id="agent_description"
          {...register("agent_description")}
          className={errors.agent_description ? "border-red-500" : ""}
          placeholder="Describe the AI assistant's capabilities and personality..."
          rows={4}
        />
        {errors.agent_description && (
          <p className="text-sm text-red-500">{errors.agent_description.message}</p>
        )}
        <p className="text-xs text-gray-500">
          This description will be used as the system prompt for the AI chatbot.
        </p>
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
