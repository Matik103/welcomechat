
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { SignOutSection } from "@/components/settings/SignOutSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, InfoIcon } from "lucide-react";
import { toast } from "sonner";

const ClientSettings = () => {
  const { user } = useAuth();
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("Fetching client info for email:", user.email);
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching client info:", error);
          throw error;
        }
        
        console.log("Client info fetched:", data);
        setClientInfo(data);
      } catch (error: any) {
        console.error("Error in fetchClientInfo:", error);
        toast.error("Failed to load client information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientInfo();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500">Manage your account preferences</p>
        </div>

        <ProfileSection 
          initialFullName={user?.user_metadata?.full_name || ""}
          initialEmail={user?.email || ""}
        />

        <SecuritySection />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5" />
              Client Information
            </CardTitle>
            <CardDescription>
              Information about your AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientInfo ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Company Name</p>
                  <p className="font-medium">{clientInfo.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">AI Assistant Name</p>
                  <p className="font-medium">{clientInfo.agent_name}</p>
                </div>
                {clientInfo.description && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{clientInfo.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      clientInfo.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {clientInfo.status || "active"}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500">No client information available</p>
            )}
          </CardContent>
        </Card>

        <SignOutSection />
      </div>
    </div>
  );
};

export default ClientSettings;
