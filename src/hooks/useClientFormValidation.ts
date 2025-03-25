
import { useState } from "react";
import { z } from "zod";
import { ClientFormData, ClientFormErrors, clientFormSchema } from "@/types/client-form";

export const useClientFormValidation = (isClientView = false) => {
  const [errors, setErrors] = useState<ClientFormErrors>({});
  
  // Create a schema based on whether it's client view or not
  const schema = isClientView 
    ? clientFormSchema.omit({ client_name: true, email: true })
    : clientFormSchema;
  
  // Validate client form data
  const validateClientForm = (data: ClientFormData): boolean => {
    try {
      // Reset errors
      setErrors({});
      
      // Validate with Zod schema
      const validationResult = schema.safeParse(data);
      
      if (!validationResult.success) {
        // Format and set errors
        const formattedErrors: ClientFormErrors = {};
        const formErrors = validationResult.error.flatten().fieldErrors;
        
        Object.entries(formErrors).forEach(([key, value]) => {
          if (value && value.length > 0) {
            formattedErrors[key] = value[0];
          }
        });
        
        setErrors(formattedErrors);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Validation error:", error);
      setErrors({ _form: "Validation failed. Please check all fields." });
      return false;
    }
  };

  return {
    errors,
    setErrors,
    validateClientForm,
    schema
  };
};

export default useClientFormValidation;
