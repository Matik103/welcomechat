
import { useState } from "react";
import { ClientAccountForm } from "@/components/client/ClientAccountForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { createNewClient } from "@/services/clientService";
import { ArrowLeft } from "lucide-react";
import { useClientActivity } from "@/hooks/useClientActivity";

export default function NewClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = async (data: { 
    client_name: string; 
    email: string; 
    agent_name: string; 
    agent_description: string;
    client_id: string;
  }) => {
    try {
      setIsSubmitting(true);
      
      // Extract the data we need to create the client
      const { client_name, email, agent_name, agent_description, client_id } = data;
      
      // Create default widget settings
      const widget_settings = {
        agent_name,
        agent_description,
        logo_url: '',
        logo_storage_path: ''
      };
      
      // Create the client
      const client = await createNewClient({
        client_name,
        email,
        agent_name,
        widget_settings
      });
      
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      
      // Log the client creation activity
      // This is now done in the createNewClient function

      // Navigate to the client page
      navigate(`/admin/clients/${client.client_id}`);
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleBack = () => {
    navigate('/admin/clients');
  };

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        
        <h1 className="text-3xl font-bold">Create New Client</h1>
        <p className="text-muted-foreground mt-1">
          Create a new client account and AI assistant
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Enter the client's details and configure their AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientAccountForm 
            onSubmit={handleSubmit} 
            isLoading={isSubmitting} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
