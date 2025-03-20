
import { NewClientForm } from "@/components/client/NewClientForm";
import { ClientFormData } from "@/types/client-form";
import { useNewClientMutation } from "@/hooks/useNewClientMutation";
import { toast } from "sonner";

export default function TestNewClient() {
  const { mutateAsync: createClient, isPending } = useNewClientMutation();

  const handleSubmit = async (data: ClientFormData) => {
    try {
      console.log("Submitting form data:", data);
      
      // Ensure required fields have values
      if (!data.client_name || !data.email) {
        toast.error("Client name and email are required");
        return;
      }
      
      // Ensure widget_settings is defined with default values
      if (!data.widget_settings) {
        data.widget_settings = {
          agent_name: "",
          agent_description: "",
          logo_url: "",
        };
      }
      
      const result = await createClient(data);
      console.log("Form submission result:", result);
      toast.success("Client created successfully");
    } catch (error) {
      console.error("Error creating client:", error);
      // Ensure we always have a meaningful error message to display
      toast.error(error instanceof Error && error.message ? error.message : "Failed to create client");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test New Client Form</h1>
      <NewClientForm 
        onSubmit={handleSubmit} 
        isSubmitting={isPending}
        initialData={{
          widget_settings: {
            agent_name: "",
            agent_description: "",
            logo_url: "",
          }
        }}  
      />
    </div>
  );
}
