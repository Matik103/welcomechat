
import { useForm } from "react-hook-form";
import { useClientFormValidation } from "./useClientFormValidation";
import { Client } from "@/types/client";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

export const useClientForm = (initialData?: Client | null, isClientView = false) => {
  const [tempLogoFile, setTempLogoFile] = useState<File | null>(null);
  const { schema } = useClientFormValidation(isClientView);
  
  // Get agent description from initialData if available
  // Look for it in widget_settings first (new approach) or ai_agents relation if available
  const agentDescription = initialData?.widget_settings && 
                          typeof initialData.widget_settings === 'object' ? 
                          (initialData.widget_settings as any).agent_description || "" : 
                          "";
  
  // Get agent_name from widget_settings or from the top-level property
  const agentName = initialData?.widget_settings && 
                   typeof initialData.widget_settings === 'object' && 
                   (initialData.widget_settings as any).agent_name ? 
                   (initialData.widget_settings as any).agent_name : 
                   initialData?.agent_name || "Assistant";

  // Get logo url from widget settings
  const logoUrl = initialData?.widget_settings && 
                 typeof initialData.widget_settings === 'object' ? 
                 (initialData.widget_settings as any).logo_url || "" : 
                 initialData?.logo_url || "";

  const logoStoragePath = initialData?.widget_settings && 
                         typeof initialData.widget_settings === 'object' ? 
                         (initialData.widget_settings as any).logo_storage_path || "" : 
                         initialData?.logo_storage_path || "";
  
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
      const agentDescription = initialData.widget_settings && 
                              typeof initialData.widget_settings === 'object' ? 
                              (initialData.widget_settings as any).agent_description || "" : 
                              "";
      
      const agentName = initialData.widget_settings && 
                       typeof initialData.widget_settings === 'object' && 
                       (initialData.widget_settings as any).agent_name ? 
                       (initialData.widget_settings as any).agent_name : 
                       initialData.agent_name || "Assistant";

      const logoUrl = initialData.widget_settings && 
                     typeof initialData.widget_settings === 'object' ? 
                     (initialData.widget_settings as any).logo_url || "" : 
                     initialData.logo_url || "";

      const logoStoragePath = initialData.widget_settings && 
                             typeof initialData.widget_settings === 'object' ? 
                             (initialData.widget_settings as any).logo_storage_path || "" : 
                             initialData.logo_storage_path || "";
      
      form.reset({
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: agentName,
        logo_url: logoUrl,
        logo_storage_path: logoStoragePath,
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

  // Prepare form data for submission - now separating client data from widget settings
  const prepareFormData = (data: any) => {
    // Create widget settings object
    const widgetSettings = {
      agent_name: data.agent_name,
      agent_description: data.agent_description,
      logo_url: data.logo_url || "",
      logo_storage_path: data.logo_storage_path || ""
    };
    
    // Only include client-specific data at the top level
    const formData = {
      client_name: data.client_name,
      email: data.email,
      _tempLogoFile: tempLogoFile,
      widget_settings: widgetSettings
    };
    
    return formData;
  };

  return {
    form,
    handleLogoChange,
    prepareFormData
  };
};
