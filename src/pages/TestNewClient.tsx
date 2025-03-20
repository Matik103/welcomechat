import { NewClientForm } from "@/components/client/NewClientForm";
import { ClientFormData } from "@/types/client-form";
import { useNewClientMutation } from "@/hooks/useNewClientMutation";
import { toast } from "sonner";

export default function TestNewClient() {
  const { mutateAsync: createClient, isPending } = useNewClientMutation();

  const handleSubmit = async (data: ClientFormData) => {
    try {
      console.log("Submitting form data:", data);
      const result = await createClient(data);
      console.log("Form submission result:", result);
      toast.success("Client created successfully");
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Failed to create client");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test New Client Form</h1>
      <NewClientForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </div>
  );
} 