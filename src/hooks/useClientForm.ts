
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Client, ClientFormData } from "@/types/client";

const clientFormSchema = z.object({
  client_name: z.string().min(2, "Client name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  widget_settings: z.object({
    agent_name: z.string().min(1, "Agent name is required"),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional(),
  }),
  _tempLogoFile: z.any().optional(),
});

export const useClientForm = (initialData?: Client | null, isClientView = false) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Set default values based on initial data or empty values
  const defaultValues = {
    client_name: initialData?.client_name || "",
    email: initialData?.email || "",
    widget_settings: {
      agent_name: initialData?.agent_name || initialData?.name || initialData?.widget_settings?.agent_name || "AI Assistant",
      agent_description: initialData?.agent_description || initialData?.widget_settings?.agent_description || "",
      logo_url: initialData?.logo_url || initialData?.widget_settings?.logo_url || "",
      logo_storage_path: initialData?.logo_storage_path || initialData?.widget_settings?.logo_storage_path || "",
    },
    _tempLogoFile: null as File | null,
  };

  const form = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });

  // Watch values
  const watchedValues = form.watch();

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    form.setValue("_tempLogoFile", file);
  };

  const prepareFormData = (formData: any): ClientFormData => {
    const clientFormData: ClientFormData = {
      client_name: formData.client_name,
      email: formData.email,
      widget_settings: {
        agent_name: formData.widget_settings.agent_name,
        agent_description: formData.widget_settings.agent_description,
        logo_url: formData.widget_settings.logo_url,
        logo_storage_path: formData.widget_settings.logo_storage_path,
      },
      _tempLogoFile: logoFile,
    };

    if (isClientView) {
      // In client view, we need to be careful not to overwrite some fields
      if (initialData) {
        if (!clientFormData.widget_settings) {
          clientFormData.widget_settings = {};
        }
      }
    }

    return clientFormData;
  };

  return {
    form,
    handleLogoChange,
    prepareFormData,
  };
};
