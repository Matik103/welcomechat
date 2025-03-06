
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { ClientForm } from "@/components/client/ClientForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const EditClientInfo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  
  const { client, isLoadingClient, error, clientMutation } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);

  if (!clientId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-700">No client ID found. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    try {
      await clientMutation.mutateAsync(data);
      
      // Log client information update activity
      await logClientActivity(
        "client_updated", 
        "updated their client information",
        { 
          updated_fields: Object.keys(data).filter(key => 
            client && data[key as keyof typeof data] !== client[key as keyof typeof client]
          )
        }
      );
      
      toast.success("Your information has been updated successfully");
    } catch (error) {
      console.error("Error submitting client form:", error);
      toast.error("Failed to update your information");
    }
  };

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-700">Error loading your information: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/client/view"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Your Information</h1>
          <p className="text-gray-500">Update your client information</p>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            initialData={client}
            onSubmit={handleSubmit}
            isLoading={clientMutation.isPending}
            isClientView={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditClientInfo;
