
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

  // Extract logo URL from initialData when it changes
  useEffect(() => {
    if (initialData) {
      console.log("ClientForm: initial data received:", initialData);
      
      // Check for logo URL in widget_settings first
      let logoUrl = '';
      
      if (initialData.widget_settings && typeof initialData.widget_settings === 'object') {
        logoUrl = (initialData.widget_settings as any).logo_url || '';
        console.log("ClientForm: Found logo URL in widget_settings:", logoUrl);
      }
      
      // Fallback to direct property
      if (!logoUrl && initialData.logo_url) {
        logoUrl = initialData.logo_url;
        console.log("ClientForm: Using fallback logo_url property:", logoUrl);
      }
      
      if (logoUrl) {
        console.log("ClientForm: Setting logo preview URL:", logoUrl);
        setLogoPreviewUrl(logoUrl);
        
        // Also update the form with the logo URL
        form.setValue("logo_url", logoUrl);
        
        if (initialData.logo_storage_path) {
          form.setValue("logo_storage_path", initialData.logo_storage_path);
        } else if (initialData.widget_settings && (initialData.widget_settings as any).logo_storage_path) {
          form.setValue("logo_storage_path", (initialData.widget_settings as any).logo_storage_path);
        }
      } else {
        console.log("ClientForm: No logo URL found in initialData");
      }
    }
  }, [initialData, form]);

  const handleSubmitForm = async (formData: any) => {
    console.log("Form submitted with data:", formData);
    const clientFormData = prepareFormData(formData);
    console.log("Prepared form data:", clientFormData);
    await onSubmit(clientFormData);
  };

  const handleLogoUpload = (file: File | null) => {
    handleLogoChange(file);
    
    // Generate preview URL for the selected file
    if (file) {
      const url = URL.createObjectURL(file);
      console.log("Created preview URL for uploaded logo:", url);
      setLogoPreviewUrl(url);
    } else {
      console.log("Logo file cleared, removing preview");
      setLogoPreviewUrl(null);
      // Clear the logo URL and storage path in the form
      form.setValue("logo_url", "");
      form.setValue("logo_storage_path", "");
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
