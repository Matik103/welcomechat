
import { useForm } from "react-hook-form";
import { useClientFormValidation } from "./useClientFormValidation";
import { Client } from "@/types/client";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

export const useClientForm = (initialData?: Client | null, isClientView = false) => {
  const [tempLogoFile, setTempLogoFile] = useState<File | null>(null);
  const { schema } = useClientFormValidation(isClientView);
  
  // Extract data from initialData safely
  const getWidgetSetting = (data: any, key: string, defaultValue: string = ""): string => {
    if (!data) return defaultValue;
    
    if (data.widget_settings && typeof data.widget_settings === 'object' && 
        (data.widget_settings as any)[key]) {
      return (data.widget_settings as any)[key] || defaultValue;
    }
    
    // Try to get the value directly from the object
    return data[key] || defaultValue;
  };
  
  // Get agent description and name from initialData
  const agentDescription = getWidgetSetting(initialData, 'agent_description', '');
  const agentName = getWidgetSetting(initialData, 'agent_name', initialData?.agent_name || 'Chat');
  const logoUrl = getWidgetSetting(initialData, 'logo_url', initialData?.logo_url || '');
  const logoStoragePath = getWidgetSetting(initialData, 'logo_storage_path', initialData?.logo_storage_path || '');
  
  console.log("useClientForm initialization with:", {
    agentName,
    agentDescription,
    logoUrl,
    logoStoragePath
  });
  
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
      console.log("useClientForm: Syncing form with initialData:", initialData);
      
      // Extract values, falling back through the different possible locations
      const agentDescription = getWidgetSetting(initialData, 'agent_description', '');
      const agentName = getWidgetSetting(initialData, 'agent_name', initialData?.agent_name || 'Chat');
      const logoUrl = getWidgetSetting(initialData, 'logo_url', initialData?.logo_url || '');
      const logoStoragePath = getWidgetSetting(initialData, 'logo_storage_path', initialData?.logo_storage_path || '');
      
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
      console.log("Logo file selected:", file.name, file.type, file.size);
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
    
    console.log("Preparing form data with widget settings:", widgetSettings);
    
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
