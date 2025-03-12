import { useState } from "react";
import { useParams } from "react-router-dom";
import { useClientData } from "@/hooks/useClientData";
import { toast } from "react-hot-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const EditClientInfo = () => {
  const { id } = useParams<{ id: string }>();
  const { client, isLoading, error, updateClient } = useClientData(id);
  const [isUpdating, setIsUpdating] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");

  const handleUpdateWebsiteUrl = async (newUrl: string) => {
    if (!newUrl || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateClient({
        website_url: newUrl,
        website_url_added_at: new Date().toISOString()
      });
      setWebsiteUrl(newUrl);
      toast.success("Website URL updated successfully");
    } catch (err) {
      // Error is already handled in useClientData hook
      console.error("Error updating URL:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading client data...</span>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Failed to load client data</p>
        <p className="text-sm text-gray-500">{error?.message || "Client not found"}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Client Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={client.client_name || ''}
              readOnly
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={client.email || ''}
              readOnly
            />
          </div>
          
          <div>
            <Label htmlFor="agent-name">AI Agent Name</Label>
            <Input
              id="agent-name"
              value={client.agent_name || ''}
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="website-url">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="website-url"
                type="url"
                value={websiteUrl || client.website_url || ''}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <Button
                onClick={() => handleUpdateWebsiteUrl(websiteUrl || client.website_url || '')}
                disabled={isUpdating || !websiteUrl}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update URL'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditClientInfo;
