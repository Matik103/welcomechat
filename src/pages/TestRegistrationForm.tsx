
import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";
import { toast } from "sonner";

export default function TestRegistrationForm() {
  const handleSubmit = async (data: any) => {
    try {
      console.log("Form submitted with data:", data);
      toast.success("Form submitted successfully");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Registration Form</h1>
      <ClientRegistrationForm onSubmit={handleSubmit} />
    </div>
  );
}
