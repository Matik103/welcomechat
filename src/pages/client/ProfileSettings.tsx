
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ClientDetails } from "@/components/client/ClientDetails";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const ProfileSettings = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { client, isLoadingClient, error, clientMutation } = useClientData(clientId);
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load client data");
      console.error("Error loading client data:", error);
    }
  }, [error]);

  const handleBack = () => {
    navigate("/client/view");
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600">Client data not found</h1>
          <p className="mt-2 text-gray-600">
            Unable to load your profile information. Please contact support.
          </p>
          <Button 
            variant="ghost" 
            className="mt-4 flex items-center gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" /> Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-500">Manage your profile information and data sources</p>
          </div>
        </div>

        <Card className="bg-white p-6">
          <ClientDetails
            client={client}
            onSubmit={async (data) => {
              setIsSubmitting(true);
              try {
                await clientMutation.mutateAsync(data);
                toast.success("Profile updated successfully");
              } catch (error) {
                console.error("Failed to update profile:", error);
                toast.error("Failed to update profile");
              } finally {
                setIsSubmitting(false);
              }
            }}
            isSubmitting={isSubmitting}
            cancelUrl="/client/view"
            formTitle="Profile Information"
            submitLabel="Save Changes"
          />
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;
