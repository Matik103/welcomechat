
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client } from "@/types/client";
import { useClientFormValidation } from "./useClientFormValidation";

interface ClientFormFields {
  client_name: string;
  email: string;
  agent_name?: string;
  logo_url?: string;
  logo_storage_path?: string;
}

export const useClientForm = (initialData?: Client | null, isClientView: boolean = false) => {
  const [tempLogoFile, setTempLogoFile] = useState<File | null>(null);
  const { schema } = useClientFormValidation(isClientView);
  
  const form = useForm<ClientFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_name: initialData?.client_name || "",
      email: initialData?.email || "",
      agent_name: initialData?.agent_name || "",
      logo_url: initialData?.logo_url || "",
      logo_storage_path: initialData?.logo_storage_path || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      console.log("Setting form values with initial data:", initialData);
      form.reset({
        client_name: initialData.client_name || "",
        email: initialData.email || "",
        agent_name: initialData.agent_name || "",
        logo_url: initialData.logo_url || "",
        logo_storage_path: initialData.logo_storage_path || "",
      });
    }
  }, [initialData, form.reset]);

  const handleLogoChange = (file: File | null) => {
    setTempLogoFile(file);
  };

  const prepareFormData = (data: ClientFormFields) => {
    return {
      ...data,
      _tempLogoFile: tempLogoFile
    };
  };

  return {
    form,
    tempLogoFile,
    handleLogoChange,
    prepareFormData
  };
};
