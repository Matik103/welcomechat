
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ClientFormData } from "@/types/client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ClientFormProps {
  initialData?: {
    client_name: string;
    email: string;
    agent_name: string;
  } | null;
  onSubmit: (data: ClientFormData) => void;
  isLoading: boolean;
}

export const ClientForm = ({ initialData, onSubmit, isLoading }: ClientFormProps) => {
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [aiAgentName, setAiAgentName] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialData) {
      setClientName(initialData.client_name);
      setEmail(initialData.email);
      setAiAgentName(initialData.agent_name);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);

    try {
      if (!initialData) {
        // Submit the form data first to create the client
        await onSubmit({
          client_name: clientName,
          email,
          agent_name: aiAgentName,
        });

        // Create user account through Supabase function
        const { data, error } = await supabase.functions.invoke('create-client-user', {
          body: {
            email,
            clientName,
            aiAgentName
          }
        });

        if (error) throw error;

        // Invalidate the clients query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["clients"] });

        toast.success("Account created and setup instructions sent to " + email);
      } else {
        // Just update the client data
        await onSubmit({
          client_name: clientName,
          email,
          agent_name: aiAgentName,
        });
      }

    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Failed to create client");
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
          Client Name
        </label>
        <Input
          id="clientName"
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={!!initialData} // Disable email field when editing
        />
      </div>
      <div>
        <label htmlFor="aiAgentName" className="block text-sm font-medium text-gray-700 mb-1">
          AI Agent Name
        </label>
        <Input
          id="aiAgentName"
          type="text"
          value={aiAgentName}
          onChange={(e) => setAiAgentName(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center justify-end gap-4">
        <Link
          to="/clients"
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          disabled={isLoading || isCreatingUser}
        >
          {(isLoading || isCreatingUser) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Save Client"
          )}
        </Button>
      </div>
    </form>
  );
};
