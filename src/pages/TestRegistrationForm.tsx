
import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TestEmailComponent } from "@/components/client/TestEmailComponent";

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Registration Form</h1>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link to="/admin/test-new-client">Test New Client</Link>
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Email Functionality</h2>
        <TestEmailComponent />
      </div>
      
      <ClientRegistrationForm onSubmit={handleSubmit} />
    </div>
  );
}
