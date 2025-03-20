
import { NewClientForm } from "@/components/client/NewClientForm";
import { ClientFormData } from "@/types/client-form";
import { useNewClientMutation } from "@/hooks/useNewClientMutation";
import { toast } from "sonner";

export default function TestNewClient() {
  const { mutateAsync: createAgent, isPending } = useNewClientMutation();

  const handleSubmit = async (data: ClientFormData) => {
    try {
      console.log("Submitting form data:", data);
      const result = await createAgent(data);
      console.log("Form submission result:", result);
      toast.success("AI Agent created successfully");
    } catch (error) {
      console.error("Error creating AI agent:", error);
      toast.error("Failed to create AI agent");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test New AI Agent Form</h1>
      <NewClientForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </div>
  );
}
