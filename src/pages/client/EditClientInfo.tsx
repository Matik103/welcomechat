import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { ClientForm } from "@/components/client/ClientForm";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { checkAndRefreshAuth, getCurrentUser } from "@/services/authService";

const EditClientInfo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Initialize client ID from user metadata
  useEffect(() => {
    const initializeClientId = async () => {
      try {
        // Try to refresh auth session if needed
        await checkAndRefreshAuth();
        
        // Get the most up-to-date user data
        const currentUser = await getCurrentUser();
        
        console.log("EditClientInfo - Current user:", currentUser);
        console.log("EditClientInfo - User metadata:", currentUser?.user_metadata);
        
        if (currentUser?.user_metadata?.client_id) {
          console.log("EditClientInfo - Setting client ID from metadata:", currentUser.user_metadata.client_id);
          setClientId(currentUser.user_metadata.client_id);
        } else if (user?.user_metadata?.client_id) {
          console.log("EditClientInfo - Setting client ID from context user:", user.user_metadata.client_id);
          setClientId(user.user_metadata.client_id);
        } else {
          console.error("EditClientInfo - No client ID found in user metadata");
          setClientId(null);
        }
      } catch (error) {
        console.error("EditClientInfo - Error initializing client ID:", error);
        setClientId(null);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeClientId();
  }, [user]);
  
  // Use the client ID to fetch client data
  const { client, isLoadingClient, error, clientMutation, clientId: resolvedClientId } = useClientData(clientId || undefined);
  const { logClientActivity } = useClientActivity(clientId || resolvedClientId || undefined);

  // Handle the form submission
  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    const effectiveClientId = clientId || resolvedClientId;
    
    if (!effectiveClientId) {
      toast.error("No client ID available. Cannot save changes.");
      return;
    }
    
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
    } catch (error: any) {
      console.error("Error submitting client form:", error);
      toast.error(`Failed to update your information: ${error.message || "Unknown error"}`);
    }
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Initializing...</span>
      </div>
    );
  }

  // Handle case when no client ID is found
  if (!clientId && !resolvedClientId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to="/client/view"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Edit Your Information</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600">No client information found.</p>
              <p className="text-sm text-gray-500 mt-2">Please contact support for assistance.</p>
            </div>
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
        <h1 className="text-2xl font-bold">Edit Your Information</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm 
              client={client}
              isLoading={isLoadingClient}
              error={error}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        <ClientResourceSections clientId={clientId || resolvedClientId} />
      </div>
    </div>
  );
};

export default EditClientInfo;
