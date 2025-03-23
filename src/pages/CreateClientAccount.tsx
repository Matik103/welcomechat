
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NewClientForm } from "@/components/forms/NewClientForm";

export default function CreateClientAccount() {
  const navigate = useNavigate();

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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Client Account</CardTitle>
            </CardHeader>
            <CardContent>
              <NewClientForm />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Process Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Client Creation Process</AlertTitle>
                <AlertDescription>
                  When you submit the form, we'll:
                  <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                    <li>Generate a unique client ID (UUID)</li>
                    <li>Create a new AI agent in the database</li>
                    <li>Generate a secure temporary password</li>
                    <li>Send a welcome email with login details</li>
                    <li>Set up the OpenAI assistant (if enabled)</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
