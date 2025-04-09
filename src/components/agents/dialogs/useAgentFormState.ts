
import { useState } from "react";

export function useAgentFormState() {
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setAgentName("");
    setAgentDescription("");
    setLogoFile(null);
    setLogoPreview(null);
    setIsSubmitting(false);
  };

  return {
    agentName,
    setAgentName,
    agentDescription,
    setAgentDescription,
    logoFile,
    logoPreview,
    isSubmitting,
    setIsSubmitting,
    handleLogoChange,
    resetForm
  };
}
