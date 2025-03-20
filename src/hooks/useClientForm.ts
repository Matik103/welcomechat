
import { useForm } from "react-hook-form";
import { useClientFormValidation } from "./useClientFormValidation";
import { Client } from "@/types/client";
import { useState, useEffect } from "react";

export const useClientForm = (initialData?: Client | null, isClientView = false) => {
  const [tempLogoFile, setTempLogoFile] = useState<File | null>(null);
  const { getValidationSchema } = useClientFormValidation();
  
  // Setup form with validation schema
  const form = useForm({
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: initialData?.agent_name || "AI Assistant",
      logo_url: initialData?.logo_url || "",
      logo_storage_path: initialData?.logo_storage_path || "",
    },
    resolver: getValidationSchema(isClientView)
  });

  // Sync form with initialData when it changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: initialData.agent_name || "AI Assistant",
        logo_url: initialData.logo_url || "",
        logo_storage_path: initialData.logo_storage_path || "",
      });
    }
  }, [initialData, form]);

  // Handle logo file changes
  const handleLogoChange = (file: File | null) => {
    setTempLogoFile(file);
    
    if (file) {
      console.log("Logo file selected:", file.name);
    } else {
      console.log("Logo file cleared");
    }
  };

  // Prepare form data for submission
  const prepareFormData = (data: any) => {
    const formData = {
      ...data,
      _tempLogoFile: tempLogoFile,
      widget_settings: {
        agent_description: "",
        logo_url: data.logo_url || "",
        logo_storage_path: data.logo_storage_path || ""
      }
    };
    
    // Extract agent description from initial data if available
    if (initialData?.widget_settings && 
        typeof initialData.widget_settings === 'object' && 
        initialData.widget_settings !== null) {
      const agentDescription = (initialData.widget_settings as any).agent_description || "";
      formData.widget_settings.agent_description = agentDescription;
    }
    
    return formData;
  };

  return {
    form,
    handleLogoChange,
    prepareFormData
  };
};
