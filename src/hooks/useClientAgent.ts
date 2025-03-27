
import { useState } from 'react';
import { clientAgentService } from '@/services/clientAgentService';
import { toast } from 'sonner';

export interface ClientAgentFormData {
  clientName: string;
  email: string;
  agentName: string;
  agentDescription: string;
}

export function useClientAgent() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClientAgent = async (formData: ClientAgentFormData) => {
    try {
      setIsCreating(true);
      setError(null);
      
      // Generate a temporary client ID
      const tempClientId = crypto.randomUUID();
      
      const { success, data, error } = await clientAgentService.createAgent(
        tempClientId,
        formData.agentName,
        formData.agentDescription,
        "", // logoUrl
        "", // logoStoragePath
        formData.clientName
      );
      
      if (success) {
        toast.success("Client created successfully!");
        return { success: true, data };
      } else {
        const errorMessage = error?.message || "Failed to create client";
        setError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      const errorMessage = error?.message || "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createClientAgent,
    isCreating,
    error,
  };
}
