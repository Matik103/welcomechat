
import { useForm } from "react-hook-form";
import { useClientFormValidation } from "./useClientFormValidation";
import { Client } from "@/types/client";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

export const useClientForm = (initialData?: Client | null, isClientView = false) => {
  const [tempLogoFile, setTempLogoFile] = useState<File | null>(null);
  const { schema } = useClientFormValidation(isClientView);
  
  // Extract agent description from initialData
  const agentDescription = initialData?.agent_description || 
                         (initialData?.widget_settings && 
                          typeof initialData.widget_settings === 'object' ? 
                          (initialData.widget_settings as any).agent_description || "" : 
                          initialData?.description || "");
  
  // Extract agent_name
  const agentName = initialData?.agent_name || 
                   initialData?.name || 
                   (initialData?.widget_settings && 
                    typeof initialData.widget_settings === 'object' ? 
                    (initialData.widget_settings as any).agent_name || "" : 
                    "Chat");

  // Extract logo_url - try to get it from multiple places to ensure we find it
  const logoUrl = initialData?.logo_url || 
                 (initialData?.widget_settings && 
                  typeof initialData.widget_settings === 'object' ? 
                  (initialData.widget_settings as any).logo_url || "" : 
                  "");

  // Extract logo_storage_path
  const logoStoragePath = initialData?.logo_storage_path || 
                         (initialData?.widget_settings && 
                          typeof initialData.widget_settings === 'object' ? 
                          (initialData.widget_settings as any).logo_storage_path || "" : 
                          "");
  
  // Log the initial values for debugging
  useEffect(() => {
    console.log("useClientForm initial values:", {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: agentName,
      agent_description: agentDescription,
      logo_url: logoUrl,
      logo_storage_path: logoStoragePath
    });
  }, [initialData, agentName, agentDescription, logoUrl, logoStoragePath]);
  
  // Setup form with validation schema
  const form = useForm({
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: agentName,
      logo_url: logoUrl,
      logo_storage_path: logoStoragePath,
      agent_description: agentDescription
    },
    resolver: zodResolver(schema)
  });

  // Sync form with initialData when it changes
  useEffect(() => {
    if (initialData) {
      const currentAgentDescription = initialData.agent_description || 
                                   (initialData.widget_settings && 
                                    typeof initialData.widget_settings === 'object' ? 
                                    (initialData.widget_settings as any).agent_description || "" : 
                                    initialData.description || "");
      
      const currentAgentName = initialData.agent_name || 
                             initialData.name || 
                             (initialData.widget_settings && 
                              typeof initialData.widget_settings === 'object' ? 
                              (initialData.widget_settings as any).agent_name || "" : 
                              "Chat");

      const currentLogoUrl = initialData.logo_url || 
                           (initialData.widget_settings && 
                            typeof initialData.widget_settings === 'object' ? 
                            (initialData.widget_settings as any).logo_url || "" : 
                            "");

      const currentLogoStoragePath = initialData.logo_storage_path || 
                                   (initialData.widget_settings && 
                                    typeof initialData.widget_settings === 'object' ? 
                                    (initialData.widget_settings as any).logo_storage_path || "" : 
                                    "");
      
      console.log("useClientForm updating form values:", {
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: currentAgentName,
        agent_description: currentAgentDescription,
        logo_url: currentLogoUrl,
        logo_storage_path: currentLogoStoragePath
      });
      
      form.reset({
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: currentAgentName,
        logo_url: currentLogoUrl,
        logo_storage_path: currentLogoStoragePath,
        agent_description: currentAgentDescription
      });
    }
  }, [initialData, form]);

  // Handle logo file changes
  const handleLogoChange = (file: File | null) => {
    setTempLogoFile(file);
    
    if (file) {
      console.log("useClientForm: Logo file selected:", file.name);
    } else {
      console.log("useClientForm: Logo file cleared");
      // Clear logo-related form fields
      form.setValue("logo_url", "");
      form.setValue("logo_storage_path", "");
    }
  };

  // Prepare form data for submission
  const prepareFormData = (data: any) => {
    // Create widget settings object
    const widgetSettings = {
      agent_name: data.agent_name,
      agent_description: data.agent_description,
      logo_url: data.logo_url || "",
      logo_storage_path: data.logo_storage_path || ""
    };
    
    // Include client-specific data at the top level
    const formData = {
      client_name: data.client_name,
      email: data.email,
      agent_name: data.agent_name,
      agent_description: data.agent_description,
      logo_url: data.logo_url || "",
      logo_storage_path: data.logo_storage_path || "",
      _tempLogoFile: tempLogoFile,
      widget_settings: widgetSettings
    };
    
    console.log("Prepared form data for submission:", formData);
    return formData;
  };

  return {
    form,
    handleLogoChange,
    prepareFormData
  };
};
