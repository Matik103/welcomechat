
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
    agent_description?: string;
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
      console.log("Initializing form with data:", initialData);
      
      // Extract agent description from different possible locations
      const agentDescription = initialData.widget_settings && 
                              typeof initialData.widget_settings === 'object' ? 
                              (initialData.widget_settings as any).agent_description || 
                              initialData.description || "" : 
                              initialData.description || "";
      
      // Extract agent name from different possible locations
      const agentName = initialData.widget_settings && 
                       typeof initialData.widget_settings === 'object' && 
                       (initialData.widget_settings as any).agent_name ? 
                       (initialData.widget_settings as any).agent_name : 
                       initialData.agent_name || initialData.name || "";

      // Extract logo URL from different possible locations
      const logoUrl = initialData.widget_settings && 
                     typeof initialData.widget_settings === 'object' ? 
                     (initialData.widget_settings as any).logo_url || 
                     initialData.logo_url || "" : 
                     initialData.logo_url || "";

      // Extract logo storage path
      const logoStoragePath = initialData.widget_settings && 
                             typeof initialData.widget_settings === 'object' ? 
                             (initialData.widget_settings as any).logo_storage_path || 
                             initialData.logo_storage_path || "" : 
                             initialData.logo_storage_path || "";
      
      form.reset({
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: agentName,
        agent_description: agentDescription,
        logo_url: logoUrl,
        logo_storage_path: logoStoragePath
      });
    }
  }, [initialData, form]);

  const handleFormSubmit = async (data: any) => {
    console.log("ClientForm submitting data:", data);
    await onSubmit(prepareFormData(data));
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <ClientNameField 
        form={form} 
        defaultValue={initialData?.client_name} 
      />
      
      <EmailField 
        form={form} 
        defaultValue={initialData?.email} 
      />
      
      <AgentNameField 
        form={form} 
        isClientView={isClientView} 
        defaultValue={initialData?.agent_name || initialData?.name} 
      />
      
      <AgentDescriptionField 
        form={form} 
        isClientView={isClientView} 
        defaultValue={initialData?.description || (initialData?.widget_settings && typeof initialData.widget_settings === 'object' ? (initialData.widget_settings as any).agent_description : '')} 
      />
      
      <LogoField 
        form={form} 
        onLogoFileChange={handleLogoChange} 
        clientId={initialData?.id || ''}
      />
      
      <FormActions 
        isLoading={isLoading} 
        isClientView={isClientView}
        hasInitialData={!!initialData}
      />
    </form>
  );
};
