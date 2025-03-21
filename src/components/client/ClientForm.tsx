
import { Client } from "@/types/client";
import { useClientForm } from "@/hooks/useClientForm";
import { ClientNameField } from "./form-fields/ClientNameField";
import { EmailField } from "./form-fields/EmailField";
import { AgentNameField } from "./form-fields/AgentNameField";
import { AgentDescriptionField } from "./form-fields/AgentDescriptionField";
import { LogoField } from "./form-fields/LogoField";
import { FormActions } from "./form-fields/FormActions";
import { useEffect } from "react";

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: { 
    client_name: string; 
    email: string; 
    agent_name?: string;
    logo_url?: string;
    logo_storage_path?: string;
    _tempLogoFile?: File | null;
  }) => Promise<void>;
  isLoading?: boolean;
  isClientView?: boolean;
}

export const ClientForm = ({ 
  initialData, 
  onSubmit, 
  isLoading = false, 
  isClientView = false
}: ClientFormProps) => {
  const { form, handleLogoChange, prepareFormData } = useClientForm(initialData, isClientView);
  
  // Re-initialize form when initialData changes (e.g., when admin switches clients)
  useEffect(() => {
    if (initialData) {
      form.reset({
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: initialData.agent_name || initialData.name || 
          (initialData.widget_settings && (initialData.widget_settings as any).agent_name) || "",
        agent_description: (initialData.widget_settings && (initialData.widget_settings as any).agent_description) || "",
        logo_url: initialData.logo_url || (initialData.widget_settings && (initialData.widget_settings as any).logo_url) || "",
        logo_storage_path: initialData.logo_storage_path || 
          (initialData.widget_settings && (initialData.widget_settings as any).logo_storage_path) || ""
      });
    }
  }, [initialData, form]);

  const handleFormSubmit = async (data: any) => {
    console.log("ClientForm submitting data:", data);
    await onSubmit(prepareFormData(data));
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <ClientNameField form={form} />
      <EmailField form={form} />
      <AgentNameField form={form} isClientView={isClientView} />
      <AgentDescriptionField form={form} isClientView={isClientView} />
      <LogoField form={form} onLogoFileChange={handleLogoChange} />
      
      <FormActions 
        isLoading={isLoading} 
        isClientView={isClientView}
        hasInitialData={!!initialData}
      />
    </form>
  );
};
