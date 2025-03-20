
import { useForm } from "react-hook-form";
import { useClientFormValidation } from "./useClientFormValidation";
import { Client } from "@/types/client";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

export const useClientForm = (initialData?: Client | null, isClientView = false) => {
  const [tempLogoFile, setTempLogoFile] = useState<File | null>(null);
  const { schema } = useClientFormValidation(isClientView);
  
  // Get agent description from initialData if available
  const agentDescription = initialData?.widget_settings && 
                          typeof initialData.widget_settings === 'object' ? 
                          (initialData.widget_settings as any).agent_description || "" : 
                          "";
  
  // Setup form with validation schema
  const form = useForm({
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: initialData?.agent_name || "AI Assistant",
      logo_url: initialData?.logo_url || "",
      logo_storage_path: initialData?.logo_storage_path || "",
      agent_description: agentDescription
    },
    resolver: zodResolver(schema)
  });

  // Sync form with initialData when it changes
  useEffect(() => {
    if (initialData) {
      const agentDescription = initialData.widget_settings && 
                              typeof initialData.widget_settings === 'object' ? 
                              (initialData.widget_settings as any).agent_description || "" : 
                              "";
      
      form.reset({
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: initialData.agent_name || "AI Assistant",
        logo_url: initialData.logo_url || "",
        logo_storage_path: initialData.logo_storage_path || "",
        agent_description: agentDescription
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
        agent_description: data.agent_description || "",
        logo_url: data.logo_url || "",
        logo_storage_path: data.logo_storage_path || ""
      }
    };
    
    // Remove agent_description from top level since it's now in widget_settings
    delete formData.agent_description;
    
    return formData;
  };

  return {
    form,
    handleLogoChange,
    prepareFormData
  };
};
