
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DriveLink = {
  id: number;
  link: string;
  refresh_rate: number;
};

type WebsiteUrl = {
  id: number;
  url: string;
  refresh_rate: number;
};

type ClientFormData = {
  client_name: string;
  email: string;
  agent_name: string;
};

const AddEditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Client basic info state
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [aiAgentName, setAiAgentName] = useState("");
  
  // URL and Drive Link states
  const [driveLinks, setDriveLinks] = useState<DriveLink[]>([]);
  const [websiteUrls, setWebsiteUrls] = useState<WebsiteUrl[]>([]);
  const [newDriveLink, setNewDriveLink] = useState("");
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [newDriveLinkRefreshRate, setNewDriveLinkRefreshRate] = useState(30);
  const [newWebsiteUrlRefreshRate, setNewWebsiteUrlRefreshRate] = useState(30);
  const [showNewDriveLinkForm, setShowNewDriveLinkForm] = useState(false);
  const [showNewWebsiteUrlForm, setShowNewWebsiteUrlForm] = useState(false);

  // Fetch client data
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch drive links
  const { data: existingDriveLinks = [] } = useQuery({
    queryKey: ["driveLinks", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("google_drive_links")
        .select("*")
        .eq("client_id", id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch website URLs
  const { data: existingWebsiteUrls = [] } = useQuery({
    queryKey: ["websiteUrls", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("website_urls")
        .select("*")
        .eq("client_id", id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (client) {
      setClientName(client.client_name);
      setEmail(client.email);
      setAiAgentName(client.agent_name);
    }
  }, [client]);

  useEffect(() => {
    setDriveLinks(existingDriveLinks);
  }, [existingDriveLinks]);

  useEffect(() => {
    setWebsiteUrls(existingWebsiteUrls);
  }, [existingWebsiteUrls]);

  // Mutations
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (id) {
        const { error } = await supabase
          .from("clients")
          .update(data)
          .eq("id", id);
        if (error) throw error;
        return id;
      } else {
        const { data: newClient, error } = await supabase
          .from("clients")
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return newClient.id;
      }
    },
    onSuccess: () => {
      toast.success(id ? "Client updated successfully" : "Client created successfully");
      navigate("/clients");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const addDriveLinkMutation = useMutation({
    mutationFn: async ({ link, refresh_rate }: { link: string; refresh_rate: number }) => {
      if (!id) throw new Error("Client ID is required");
      const { data, error } = await supabase
        .from("google_drive_links")
        .insert({ client_id: id, link, refresh_rate })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveLinks", id] });
      setNewDriveLink("");
      setNewDriveLinkRefreshRate(30);
      setShowNewDriveLinkForm(false);
      toast.success("Drive link added successfully");
    },
    onError: (error) => {
      toast.error(`Error adding drive link: ${error.message}`);
    },
  });

  const addWebsiteUrlMutation = useMutation({
    mutationFn: async ({ url, refresh_rate }: { url: string; refresh_rate: number }) => {
      if (!id) throw new Error("Client ID is required");
      const { data, error } = await supabase
        .from("website_urls")
        .insert({ client_id: id, url, refresh_rate })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", id] });
      setNewWebsiteUrl("");
      setNewWebsiteUrlRefreshRate(30);
      setShowNewWebsiteUrlForm(false);
      toast.success("Website URL added successfully");
    },
    onError: (error) => {
      toast.error(`Error adding website URL: ${error.message}`);
    },
  });

  const deleteDriveLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const { error } = await supabase
        .from("google_drive_links")
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveLinks", id] });
      toast.success("Drive link removed successfully");
    },
    onError: (error) => {
      toast.error(`Error removing drive link: ${error.message}`);
    },
  });

  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: async (urlId: number) => {
      const { error } = await supabase
        .from("website_urls")
        .delete()
        .eq("id", urlId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", id] });
      toast.success("Website URL removed successfully");
    },
    onError: (error) => {
      toast.error(`Error removing website URL: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ClientFormData = {
      client_name: clientName,
      email,
      agent_name: aiAgentName,
    };
    clientMutation.mutate(payload);
  };

  const handleAddDriveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriveLink) return;
    addDriveLinkMutation.mutate({
      link: newDriveLink,
      refresh_rate: newDriveLinkRefreshRate,
    });
  };

  const handleAddWebsiteUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebsiteUrl) return;
    addWebsiteUrlMutation.mutate({
      url: newWebsiteUrl,
      refresh_rate: newWebsiteUrlRefreshRate,
    });
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            to="/clients"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? `Edit Client - ${client?.client_name}` : "Add New Client"}
            </h1>
            <p className="text-gray-500">
              {id ? "Update client information" : "Create a new client"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <Input
                  id="clientName"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="aiAgentName" className="block text-sm font-medium text-gray-700 mb-1">
                  AI Agent Name
                </label>
                <Input
                  id="aiAgentName"
                  type="text"
                  value={aiAgentName}
                  onChange={(e) => setAiAgentName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {id && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Drive Share Links</h2>
                <div className="space-y-4">
                  {driveLinks.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="flex-1 truncate text-sm">{link.link}</span>
                      <span className="text-sm text-gray-500 whitespace-nowrap">({link.refresh_rate} days)</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDriveLinkMutation.mutate(link.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}

                  {!showNewDriveLinkForm ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewDriveLinkForm(true)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Google Drive Link
                    </Button>
                  ) : (
                    <form onSubmit={handleAddDriveLink} className="space-y-4">
                      <Input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={newDriveLink}
                        onChange={(e) => setNewDriveLink(e.target.value)}
                        required
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Refresh Rate (days)
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={newDriveLinkRefreshRate}
                            onChange={(e) => setNewDriveLinkRefreshRate(parseInt(e.target.value))}
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Button type="submit" disabled={addDriveLinkMutation.isPending}>
                            {addDriveLinkMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowNewDriveLinkForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Website URLs</h2>
                <div className="space-y-4">
                  {websiteUrls.map((url) => (
                    <div key={url.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="flex-1 truncate text-sm">{url.url}</span>
                      <span className="text-sm text-gray-500 whitespace-nowrap">({url.refresh_rate} days)</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteWebsiteUrlMutation.mutate(url.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}

                  {!showNewWebsiteUrlForm ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewWebsiteUrlForm(true)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Website URL
                    </Button>
                  ) : (
                    <form onSubmit={handleAddWebsiteUrl} className="space-y-4">
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={newWebsiteUrl}
                        onChange={(e) => setNewWebsiteUrl(e.target.value)}
                        required
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Refresh Rate (days)
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={newWebsiteUrlRefreshRate}
                            onChange={(e) => setNewWebsiteUrlRefreshRate(parseInt(e.target.value))}
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Button type="submit" disabled={addWebsiteUrlMutation.isPending}>
                            {addWebsiteUrlMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowNewWebsiteUrlForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-4">
            <Link
              to="/clients"
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              disabled={clientMutation.isPending}
            >
              {clientMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Client"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditClient;

