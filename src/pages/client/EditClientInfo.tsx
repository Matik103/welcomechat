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
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateAndNotify } from "@/utils/urlValidator";

const EditClientInfo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [urls, setUrls] = useState<string[]>([]);
  const [driveUrls, setDriveUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newDriveUrl, setNewDriveUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
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

  useEffect(() => {
    fetchClientInfo();
  }, [user]);

  const fetchClientInfo = async () => {
    if (!user) return;

    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('urls, drive_urls')
        .eq('user_id', user.id)
        .single();

      if (clientError) throw clientError;

      setUrls(clientData?.urls || []);
      setDriveUrls(clientData?.drive_urls || []);
    } catch (error) {
      console.error('Error fetching client info:', error);
      toast.error('Failed to load your information');
    }
  };

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return;

    try {
      setIsLoading(true);
      
      // Validate URL before adding
      const isValid = await validateAndNotify(newUrl);
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      const updatedUrls = [...urls, newUrl];
      const { error } = await supabase
        .from('clients')
        .update({ urls: updatedUrls })
        .eq('user_id', user?.id);

      if (error) throw error;

      setUrls(updatedUrls);
      setNewUrl("");
      toast.success('URL added successfully');
    } catch (error) {
      console.error('Error adding URL:', error);
      toast.error('Failed to add URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDriveUrl = async () => {
    if (!newDriveUrl.trim()) return;

    try {
      setIsLoading(true);
      
      // Validate Google Drive URL before adding
      const isValid = await validateAndNotify(newDriveUrl);
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      const updatedDriveUrls = [...driveUrls, newDriveUrl];
      const { error } = await supabase
        .from('clients')
        .update({ drive_urls: updatedDriveUrls })
        .eq('user_id', user?.id);

      if (error) throw error;

      setDriveUrls(updatedDriveUrls);
      setNewDriveUrl("");
      toast.success('Google Drive URL added successfully');
    } catch (error) {
      console.error('Error adding Drive URL:', error);
      toast.error('Failed to add Google Drive URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUrl = async (index: number) => {
    try {
      setIsLoading(true);
      const updatedUrls = urls.filter((_, i) => i !== index);
      const { error } = await supabase
        .from('clients')
        .update({ urls: updatedUrls })
        .eq('user_id', user?.id);

      if (error) throw error;

      setUrls(updatedUrls);
      toast.success('URL removed successfully');
    } catch (error) {
      console.error('Error removing URL:', error);
      toast.error('Failed to remove URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDriveUrl = async (index: number) => {
    try {
      setIsLoading(true);
      const updatedDriveUrls = driveUrls.filter((_, i) => i !== index);
      const { error } = await supabase
        .from('clients')
        .update({ drive_urls: updatedDriveUrls })
        .eq('user_id', user?.id);

      if (error) throw error;

      setDriveUrls(updatedDriveUrls);
      toast.success('Google Drive URL removed successfully');
    } catch (error) {
      console.error('Error removing Drive URL:', error);
      toast.error('Failed to remove Google Drive URL');
    } finally {
      setIsLoading(false);
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
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-700">
              No client ID found. Please contact support or try signing out and back in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while fetching client data
  if (isLoadingClient) {
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
        
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your information...</span>
        </div>
      </div>
    );
  }

  // Show error message if client data fetch fails
  if (error) {
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
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-700">Error loading your information: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const effectiveClientId = clientId || resolvedClientId;

  // Render the form with client data
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
      
      <div className="space-y-8">
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
        
        {effectiveClientId && (
          <ClientResourceSections 
            clientId={effectiveClientId} 
            isClientView={true}
            logClientActivity={logClientActivity}
          />
        )}

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Add Website URL</Label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Enter website URL"
                className="flex-1"
              />
              <Button 
                onClick={handleAddUrl}
                disabled={isLoading || !newUrl.trim()}
              >
                Add URL
              </Button>
            </div>
            <div className="space-y-2">
              {urls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 truncate">{url}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveUrl(index)}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Add Google Drive URL</Label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={newDriveUrl}
                onChange={(e) => setNewDriveUrl(e.target.value)}
                placeholder="Enter Google Drive URL"
                className="flex-1"
              />
              <Button 
                onClick={handleAddDriveUrl}
                disabled={isLoading || !newDriveUrl.trim()}
              >
                Add Drive URL
              </Button>
            </div>
            <div className="space-y-2">
              {driveUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 truncate">{url}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveDriveUrl(index)}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClientInfo;
