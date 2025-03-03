
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DriveLinks } from "@/components/client/DriveLinks";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { useDriveLinks } from "@/hooks/useDriveLinks";

const ClientEdit = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch client ID first
  useEffect(() => {
    const fetchClientId = async () => {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("email", user.email)
          .single();
          
        if (error) throw error;
        
        setClientData(data);
        setClientName(data.client_name || "");
        setAgentName(data.agent_name || "");
        setEmail(data.email || "");
      } catch (error) {
        console.error("Error fetching client info:", error);
        toast.error("Failed to load client information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientId();
  }, [user]);

  const { 
    websiteUrls, 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation 
  } = useWebsiteUrls(clientData?.id);

  const { 
    driveLinks, 
    addDriveLinkMutation, 
    deleteDriveLinkMutation 
  } = useDriveLinks(clientData?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientData?.id) {
      toast.error("Client ID not found");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          client_name: clientName,
          agent_name: agentName,
          email: email
        })
        .eq("id", clientData.id);
        
      if (error) throw error;
      
      toast.success("Client information updated successfully");
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    return addWebsiteUrlMutation.mutateAsync(data);
  };

  const handleDeleteWebsiteUrl = async (id: number) => {
    return deleteWebsiteUrlMutation.mutateAsync(id);
  };

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    return addDriveLinkMutation.mutateAsync(data);
  };

  const handleDeleteDriveLink = async (id: number) => {
    return deleteDriveLinkMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</p>
          <p className="text-gray-600">Unable to load your client information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-500">Update your client information and knowledge sources</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Update your basic information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                  Company/Client Name
                </label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="agentName" className="block text-sm font-medium text-gray-700">
                  AI Agent Name
                </label>
                <Input
                  id="agentName"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website URLs</CardTitle>
            <CardDescription>Add websites for your AI to learn from</CardDescription>
          </CardHeader>
          <CardContent>
            <WebsiteUrls
              urls={websiteUrls}
              onAdd={handleAddWebsiteUrl}
              onDelete={handleDeleteWebsiteUrl}
              isAddLoading={addWebsiteUrlMutation.isPending}
              isDeleteLoading={deleteWebsiteUrlMutation.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Drive Links</CardTitle>
            <CardDescription>Add Google Drive documents for your AI to learn from</CardDescription>
          </CardHeader>
          <CardContent>
            <DriveLinks
              driveLinks={driveLinks}
              onAdd={handleAddDriveLink}
              onDelete={handleDeleteDriveLink}
              isAddLoading={addDriveLinkMutation.isPending}
              isDeleteLoading={deleteDriveLinkMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientEdit;
