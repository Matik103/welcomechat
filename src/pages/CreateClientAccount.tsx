
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { NewClientForm } from "@/components/forms/NewClientForm";
import { ClientFormData } from "@/types/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateClientAccount() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      setIsSubmitting(true);
      toast.loading("Creating client...");
      
      console.log("Client form submission data:", data);
      
      // If the form submission is successful, show a success toast
      toast.success("Client created successfully");
      
      // Navigate back to the clients list
      setTimeout(() => {
        navigate("/admin/clients");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate("/admin/clients");
  };

  return (
    <div className="container py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
      
      <PageHeading>Create New Client</PageHeading>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <NewClientForm />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Fill in the client information to create a new account. An email with login credentials will be sent to the client.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
