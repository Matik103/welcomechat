
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
import { LogoUpload } from "./LogoUpload";

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: { 
    client_name: string; 
    email: string; 
    agent_name?: string; 
    agent_description?: string;
    logo_file?: File;
  }) => Promise<void>;
  isLoading?: boolean;
  isClientView?: boolean;
  onLogoUpload?: (file: File) => Promise<void>;
}

const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required")
    .refine(name => !name.match(/['"`\\]/), { 
      message: 'Client name cannot include quotes or backslashes' 
    }),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().optional()
    .refine(name => !name || !name.match(/['"`\\]/), { 
      message: 'Agent name cannot include quotes or backslashes' 
    }),
  agent_description: z.string().optional()
    .refine(desc => !desc || !desc.match(/["'\\]/g), {
      message: 'Agent description cannot include quotes or backslashes'
    }),
});

export const ClientForm = ({ 
  initialData, 
  onSubmit, 
  isLoading = false, 
  isClientView = false,
  onLogoUpload
}: ClientFormProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
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
      console.log("Setting form values with initial data:", initialData);
      reset({
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: initialData.agent_name || "",
        agent_description: initialData.agent_description || "",
      });
    }
  }, [initialData, reset]);

  // For debugging: log the current form values
  const currentValues = watch();
  useEffect(() => {
    console.log("Current form values:", currentValues);
  }, [currentValues]);
  
  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    if (!onLogoUpload) return;
    
    setIsUploading(true);
    try {
      setLogoFile(file);
      if (onLogoUpload) {
        await onLogoUpload(file);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle form submission
  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      logo_file: logoFile || undefined
    });
  });

  // Get logo URL from widget_settings safely
  const getLogoUrl = (): string | null | undefined => {
    if (!initialData?.widget_settings) return null;
    
    if (typeof initialData.widget_settings === 'object' && initialData.widget_settings !== null) {
      return (initialData.widget_settings as any).logo_url;
    }
    
    return null;
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
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
        <p className="text-xs text-gray-500">Please avoid using quotes (', ", `) in the agent name.</p>
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
        <p className="text-xs text-gray-500">Please avoid using quotes (', ", `) in the description.</p>
      </div>
      
      {onLogoUpload && (
        <LogoUpload
          logoUrl={getLogoUrl()}
          onLogoUpload={handleLogoUpload}
          isUploading={isUploading}
        />
      )}

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button type="submit" disabled={isLoading || isUploading}>
          {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
