
import { Client } from "@/types/client";
import { useClientForm } from "@/hooks/useClientForm";
import { ClientNameField } from "./form-fields/ClientNameField";
import { EmailField } from "./form-fields/EmailField";
import { AgentNameField } from "./form-fields/AgentNameField";
import { LogoField } from "./form-fields/LogoField";
import { FormActions } from "./form-fields/FormActions";

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

  const handleFormSubmit = async (data: any) => {
    console.log("ClientForm submitting data:", data);
    await onSubmit(prepareFormData(data));
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <ClientNameField form={form} />
      <EmailField form={form} />
      <AgentNameField form={form} isClientView={isClientView} />
      <LogoField form={form} onLogoFileChange={handleLogoChange} />
      
      <FormActions 
        isLoading={isLoading} 
        isClientView={isClientView}
        hasInitialData={!!initialData}
      />
    </form>
  );
};
