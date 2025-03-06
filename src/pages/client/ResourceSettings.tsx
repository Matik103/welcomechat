
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { ClientDetails } from "@/components/client/ClientDetails";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, User } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ResourceSettings = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { client, isLoadingClient, error } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);

  console.log("ResourceSettings: client ID from auth:", clientId);

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-700">Error loading client data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            to="/client/view"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Resource Settings
            </h1>
            <p className="text-gray-500">
              Update your resource information
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <ClientDetails 
            client={client}
            clientId={clientId}
            isClientView={true}
            logClientActivity={logClientActivity}
          />

          {clientId && (
            <ClientResourceSections 
              clientId={clientId} 
              isClientView={true}
              logClientActivity={logClientActivity}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceSettings;
