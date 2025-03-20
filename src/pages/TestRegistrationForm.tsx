
import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";
import { toast } from "sonner";
import { ClientFormData } from "@/types/client-form";

const TestRegistrationForm = () => {
  const handleSubmit = async (data: ClientFormData) => {
    // Dummy handler for testing
    console.log("Form submitted with data:", data);
    toast.success("Form submitted successfully");
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Test Registration Form</h1>
        <ClientRegistrationForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default TestRegistrationForm;
