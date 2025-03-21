
import { useNavigate } from "react-router-dom";
import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNewClientMutation } from "@/hooks/useNewClientMutation";
import { TestEmailComponent } from "@/components/client/TestEmailComponent";

export default function NewClient() {
  const navigate = useNavigate();
  const clientMutation = useNewClientMutation();

  const handleSubmit = async (data: any) => {
    try {
      // Show loading toast
      const loadingToastId = toast.loading("Creating AI agent and sending welcome email...");
      
      // Use the mutation to create the client and send the welcome email
      const result = await clientMutation.mutateAsync(data);
      
      if (result.emailSent) {
        toast.success("Client created successfully and welcome email sent", {
          id: loadingToastId
        });
      } else {
        toast.error(`Client created but welcome email failed: ${result.emailError || "Unknown error"}`, {
          id: loadingToastId,
          duration: 6000
        });
      }
      
      console.log("Client created successfully:", result);
      navigate("/admin/clients");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Failed to create client");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Register New AI Agent</h1>
      
      <div className="mb-4">
        <TestEmailComponent />
      </div>
      
      <ClientRegistrationForm onSubmit={handleSubmit} />
    </div>
  );
}
