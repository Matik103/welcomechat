
import { Client, ClientFormData } from "@/types/client";
import { useState, useEffect } from "react";
import { useClientForm } from "@/hooks/useClientForm";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ClientNameField } from "./form-fields/ClientNameField";
import { EmailField } from "./form-fields/EmailField";
import { AgentNameField } from "./form-fields/AgentNameField";
import { AgentDescriptionField } from "./form-fields/AgentDescriptionField";
import { LogoField } from "./form-fields/LogoField";
import { Loader2 } from "lucide-react";

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading?: boolean;
  isClientView?: boolean;
}

export function ClientForm({
  initialData,
  onSubmit,
  isLoading = false,
  isClientView = false,
}: ClientFormProps) {
  const { form, handleLogoChange, prepareFormData } = useClientForm(initialData, isClientView);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // Set initial logo preview URL from initial data
  useEffect(() => {
    if (initialData) {
      let logoUrl = '';
      
      // First, check logo_url directly in the client object (ai_agents data)
      if (initialData.logo_url) {
        logoUrl = initialData.logo_url;
        console.log("Found logo_url directly on client object:", logoUrl);
      }
      
      // Fallback to checking widget_settings
      if (!logoUrl && initialData.widget_settings && typeof initialData.widget_settings === 'object') {
        logoUrl = (initialData.widget_settings as any).logo_url || '';
        console.log("Found logo_url in widget_settings:", logoUrl);
      }
      
      if (logoUrl) {
        setLogoPreviewUrl(logoUrl);
        console.log("Setting initial logo preview URL:", logoUrl);
      } else {
        console.log("No logo URL found in client data");
        setLogoPreviewUrl(null);
      }
    }
  }, [initialData]);

  const handleSubmitForm = async (formData: any) => {
    const clientFormData = prepareFormData(formData);
    await onSubmit(clientFormData);
  };

  const handleLogoUpload = (file: File | null) => {
    handleLogoChange(file);
    
    // Generate preview URL for the selected file
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreviewUrl(url);
      console.log("Created preview URL for uploaded logo:", url);
    } else {
      setLogoPreviewUrl(null);
      console.log("Cleared logo preview URL");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
        <div className="space-y-4">
          <ClientNameField control={form} />
          <EmailField control={form} />
          <AgentNameField control={form} isClientView={isClientView} />
          <AgentDescriptionField control={form} isRequired={isClientView} />
          <LogoField 
            control={form} 
            onLogoChange={handleLogoUpload} 
            logoPreviewUrl={logoPreviewUrl}
          />
        </div>

        <div className="flex justify-start pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
