import { useEffect, useState } from "react";
import { execSql } from "@/utils/rpcUtils";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { SignOutSection } from "@/components/settings/SignOutSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, InfoIcon, Settings, User, FileText, Bot } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClientLayout } from "@/components/layout/ClientLayout";

export default function ClientSettings() {
  const { user } = useAuth();
  const [clientInfo, setClientInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        const result = await execSql({
          sql: "SELECT * FROM ai_agents WHERE id = $1",
          values: [user?.user_metadata?.client_id],
        });

        if (result?.length > 0) {
          setClientInfo(result[0]);
        }
      } catch (err) {
        console.error("Error fetching client info:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.user_metadata?.client_id) {
      fetchClientInfo();
    }

    // Set a timeout for loading state
    const timeout = setTimeout(() => setLoadTimeout(true), 10000);
    return () => clearTimeout(timeout);
  }, [user]);

  if (isLoading && !loadTimeout) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center flex-col">
        <div className="text-red-500 mb-4">Error loading settings: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ClientLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Profile Settings Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your profile information and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Manage your client information, agent details, and training resources like websites and documents.
              </p>
              <Button asChild>
                <Link to="/client/edit-info" className="w-full">
                  Manage Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Account Settings Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Update your notification preferences, security settings, and account information.
              </p>
              <Button asChild>
                <Link to="/client/account-settings" className="w-full">
                  Manage Account
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Resource Settings Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Resource Settings
              </CardTitle>
              <CardDescription>
                Manage your website and document resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Add, edit, or remove websites and documents that your AI assistant uses for training.
              </p>
              <Button asChild>
                <Link to="/client/resource-settings" className="w-full">
                  Manage Resources
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Widget Settings Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                Widget Settings
              </CardTitle>
              <CardDescription>
                Customize your AI chat widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Customize the appearance, behavior, and messaging of your AI chat widget.
              </p>
              <Button asChild>
                <Link to="/client/widget-settings" className="w-full">
                  Customize Widget
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Settings Sections */}
        <div className="max-w-2xl mx-auto space-y-6">
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
                    <p className="font-medium">{clientInfo.name}</p>
                  </div>
                  {clientInfo.agent_description && (
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="font-medium">{clientInfo.agent_description}</p>
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
                      {clientInfo.status}
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
    </ClientLayout>
  );
}
