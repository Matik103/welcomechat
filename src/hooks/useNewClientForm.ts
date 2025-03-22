
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientFormData, clientFormSchema, ClientFormErrors } from "@/types/client-form";
import { toast } from "sonner";

interface UseNewClientFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  initialData?: Partial<ClientFormData>;
}

export const useNewClientForm = ({ onSubmit, initialData }: UseNewClientFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ClientFormErrors>({});

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: "",
      email: "",
      widget_settings: {
        agent_name: "", 
        agent_description: "",
        logo_url: "",
      },
      _tempLogoFile: null,
      ...initialData,
    },
  });

  const handleSubmit = async (data: ClientFormData) => {
    try {
      setIsSubmitting(true);
      setErrors({});
      
      // Validate the data
      const validationResult = clientFormSchema.safeParse(data);
      if (!validationResult.success) {
        const validationErrors = validationResult.error.flatten().fieldErrors;
        // Convert validation errors to the correct type
        const formattedErrors: ClientFormErrors = {};
        Object.entries(validationErrors).forEach(([key, value]) => {
          if (value && value.length > 0) {
            formattedErrors[key as keyof ClientFormData] = value[0];
          }
        });
        setErrors(formattedErrors);
        return;
      }

      // Handle logo file if present
      if (data._tempLogoFile) {
        console.log("Logo file present:", data._tempLogoFile.name);
      }

      // Ensure widget_settings exists and has default values
      if (!data.widget_settings) {
        data.widget_settings = {
          agent_name: "",
          agent_description: "",
          logo_url: "",
        };
      }

      // Clean up the data before submission
      const submissionData: ClientFormData = {
        client_name: data.client_name.trim(),
        email: data.email.toLowerCase().trim(),
        _tempLogoFile: data._tempLogoFile,
        widget_settings: {
          agent_name: data.widget_settings.agent_name?.trim() || "",
          agent_description: data.widget_settings.agent_description?.trim() || "",
          logo_url: data.widget_settings.logo_url || "",
        },
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoChange = (file: File | null) => {
    form.setValue("_tempLogoFile", file);
  };

  return {
    form,
    errors,
    isSubmitting,
    handleSubmit: form.handleSubmit(handleSubmit),
    handleLogoChange,
    reset: form.reset,
  };
};
