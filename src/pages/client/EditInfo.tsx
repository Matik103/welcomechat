
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { ClientDetails } from "@/components/client/ClientDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, User, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const EditInfo = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const { client, isLoadingClient, error } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  // Set client ID from user metadata when available
  useEffect(() => {
    if (user?.user_metadata?.client_id) {
      setClientId(user.user_metadata.client_id);
    }
  }, [user]);
  
  // Website URL state and hooks
  const [newUrl, setNewUrl] = useState("");
  const [urlRefreshRate, setUrlRefreshRate] = useState(30);
  const { 
    websiteUrls, 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation, 
    isLoading: isUrlsLoading 
  } = useWebsiteUrls(clientId);

  // Drive link state and hooks
  const [newDriveLink, setNewDriveLink] = useState("");
  const [driveLinkRefreshRate, setDriveLinkRefreshRate] = useState(30);
  const { 
    driveLinks, 
    addDriveLinkMutation, 
    deleteDriveLinkMutation, 
    isLoading: isDriveLinksLoading 
  } = useDriveLinks(clientId);

  console.log("EditInfo: client ID from auth:", clientId);
  console.log("Website URLs:", websiteUrls);
  console.log("Drive Links:", driveLinks);

  // Handle adding a website URL
  const handleAddUrl = async () => {
    if (!newUrl) {
      toast.error("Please enter a website URL");
      return;
    }

    if (!clientId) {
      toast.error("Client ID is missing. Please try refreshing the page.");
      return;
    }

    try {
      await addWebsiteUrlMutation.mutateAsync({
        url: newUrl,
        refresh_rate: urlRefreshRate
      });
      
      await logClientActivity(
        "website_url_added", 
        "added a website URL", 
        { url: newUrl }
      );
      
      setNewUrl("");
      setUrlRefreshRate(30);
    } catch (error) {
      console.error("Error adding URL:", error);
    }
  };

  // Handle deleting a website URL
  const handleDeleteUrl = async (id: number) => {
    try {
      const urlToDelete = websiteUrls.find(url => url.id === id);
      await deleteWebsiteUrlMutation.mutateAsync(id);
      
      if (urlToDelete) {
        await logClientActivity(
          "url_deleted", 
          "removed a website URL", 
          { url: urlToDelete.url }
        );
      }
    } catch (error) {
      console.error("Error deleting URL:", error);
    }
  };

  // Handle adding a drive link
  const handleAddDriveLink = async () => {
    if (!newDriveLink) {
      toast.error("Please enter a Google Drive link");
      return;
    }

    if (!clientId) {
      toast.error("Client ID is missing. Please try refreshing the page.");
      return;
    }

    if (!newDriveLink.includes('drive.google.com') && !newDriveLink.includes('docs.google.com')) {
      toast.error("Please enter a valid Google Drive link");
      return;
    }

    try {
      await addDriveLinkMutation.mutateAsync({
        link: newDriveLink,
        refresh_rate: driveLinkRefreshRate
      });
      
      await logClientActivity(
        "drive_link_added", 
        "added a Google Drive link", 
        { link: newDriveLink }
      );
      
      setNewDriveLink("");
      setDriveLinkRefreshRate(30);
    } catch (error) {
      console.error("Error adding drive link:", error);
    }
  };

  // Handle deleting a drive link
  const handleDeleteDriveLink = async (id: number) => {
    try {
      const linkToDelete = driveLinks.find(link => link.id === id);
      await deleteDriveLinkMutation.mutateAsync(id);
      
      if (linkToDelete) {
        await logClientActivity(
          "drive_link_deleted", 
          "removed a Google Drive link", 
          { link: linkToDelete.link }
        );
      }
    } catch (error) {
      console.error("Error deleting drive link:", error);
    }
  };

  if (isLoadingClient || isUrlsLoading || isDriveLinksLoading) {
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/client/view"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Information</h1>
          <p className="text-gray-500">Update client information</p>
        </div>
      </div>
      
      <div className="space-y-8">
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientDetails 
              client={client} 
              clientId={clientId} 
              isClientView={true}
              logClientActivity={logClientActivity}
            />
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Website URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* List of existing website URLs */}
              {websiteUrls.length > 0 ? (
                <div className="space-y-2">
                  {websiteUrls.map((url) => (
                    <div key={url.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                      <span className="flex-1 truncate text-sm">{url.url}</span>
                      <span className="text-sm text-gray-500 whitespace-nowrap">({url.refresh_rate} days)</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUrl(url.id)}
                        disabled={deleteWebsiteUrlMutation.isPending}
                        className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic py-4">No website URLs added yet.</div>
              )}

              {/* Form to add new website URL */}
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <h3 className="text-sm font-medium mb-3">Add Website URL</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website-url">Website URL</Label>
                    <Input
                      id="website-url"
                      type="url"
                      placeholder="https://example.com"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url-refresh-rate">Refresh Rate (days)</Label>
                    <Input
                      id="url-refresh-rate"
                      type="number"
                      min="1"
                      value={urlRefreshRate}
                      onChange={(e) => setUrlRefreshRate(parseInt(e.target.value) || 30)}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleAddUrl}
                    disabled={addWebsiteUrlMutation.isPending || !newUrl || !clientId}
                    className="w-full"
                  >
                    {addWebsiteUrlMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add URL
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Google Drive Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* List of existing drive links */}
              {driveLinks.length > 0 ? (
                <div className="space-y-2">
                  {driveLinks.map((link) => (
                    <div 
                      key={link.id} 
                      className={`flex items-center gap-2 p-3 rounded-md border ${
                        link.access_status === "restricted" 
                          ? "bg-amber-50 border-amber-200" 
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <span className="flex-1 truncate text-sm">{link.link}</span>
                      {link.access_status === "restricted" && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full whitespace-nowrap">
                          Restricted
                        </span>
                      )}
                      <span className="text-sm text-gray-500 whitespace-nowrap">({link.refresh_rate} days)</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDriveLink(link.id)}
                        disabled={deleteDriveLinkMutation.isPending}
                        className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic py-4">No Google Drive links added yet.</div>
              )}

              {/* Form to add new drive link */}
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <h3 className="text-sm font-medium mb-3">Add Google Drive Link</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="drive-link">Google Drive Link</Label>
                    <Input
                      id="drive-link"
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={newDriveLink}
                      onChange={(e) => setNewDriveLink(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="drive-refresh-rate">Refresh Rate (days)</Label>
                    <Input
                      id="drive-refresh-rate"
                      type="number"
                      min="1"
                      value={driveLinkRefreshRate}
                      onChange={(e) => setDriveLinkRefreshRate(parseInt(e.target.value) || 30)}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleAddDriveLink}
                    disabled={addDriveLinkMutation.isPending || !newDriveLink || !clientId}
                    className="w-full"
                  >
                    {addDriveLinkMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Drive Link
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditInfo;
