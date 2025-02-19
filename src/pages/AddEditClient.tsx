import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

type NewLinkInput = {
  url: string;
  refresh_rate: number;
};

const AddEditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [aiAgentName, setAiAgentName] = useState("");
  const [newDriveLink, setNewDriveLink] = useState<NewLinkInput>({ url: "", refresh_rate: 30 });
  const [newWebsiteUrl, setNewWebsiteUrl] = useState<NewLinkInput>({ url: "", refresh_rate: 30 });
  const [showDriveLinkInput, setShowDriveLinkInput] = useState(false);
  const [showWebsiteUrlInput, setShowWebsiteUrlInput] = useState(false);

  // Fetch client data if editing
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
    meta: {
      onSuccess: (data: any) => {
        if (data) {
          setFullName(data.full_name);
          setEmail(data.email);
          setAiAgentName(data.agent_name);
        }
      }
    }
  });

  // Fetch drive links if editing
  const { data: driveLinks = [], refetch: refetchDriveLinks } = useQuery({
    queryKey: ["driveLinks", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("google_drive_links")
        .select("*")
        .eq("client_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch website URLs if editing
  const { data: websiteUrls = [], refetch: refetchWebsiteUrls } = useQuery({
    queryKey: ["websiteUrls", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("website_urls")
        .select("*")
        .eq("client_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Add/Update client mutation
  const clientMutation = useMutation({
    mutationFn: async (data: { full_name: string; email: string; agent_name: string }) => {
      if (id) {
        const { error } = await supabase
          .from("clients")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clients")
          .insert([data]);
        if (error) throw error;
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

  // Add drive link mutation
  const addDriveLinkMutation = useMutation({
    mutationFn: async (data: NewLinkInput) => {
      const { error } = await supabase
        .from("google_drive_links")
        .insert([{ 
          client_id: id, 
          link: data.url,
          refresh_rate: data.refresh_rate
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewDriveLink({ url: "", refresh_rate: 30 });
      setShowDriveLinkInput(false);
      refetchDriveLinks();
      toast.success("Drive link added successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Add website URL mutation
  const addWebsiteUrlMutation = useMutation({
    mutationFn: async (data: NewLinkInput) => {
      const { error } = await supabase
        .from("website_urls")
        .insert([{ 
          client_id: id, 
          url: data.url,
          refresh_rate: data.refresh_rate
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewWebsiteUrl({ url: "", refresh_rate: 30 });
      setShowWebsiteUrlInput(false);
      refetchWebsiteUrls();
      toast.success("Website URL added successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Delete mutations
  const deleteDriveLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const { error } = await supabase
        .from("google_drive_links")
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDriveLinks();
      toast.success("Drive link removed successfully");
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
      refetchWebsiteUrls();
      toast.success("Website URL removed successfully");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clientMutation.mutate({
      full_name: fullName,
      email,
      agent_name: aiAgentName,
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
              {id ? `Edit Client - ${client?.full_name}` : "Add New Client"}
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
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label htmlFor="aiAgentName" className="block text-sm font-medium text-gray-700 mb-1">
                  AI Agent Name
                </label>
                <input
                  id="aiAgentName"
                  type="text"
                  value={aiAgentName}
                  onChange={(e) => setAiAgentName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
          </div>

          {id && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Google Drive Share Links</h2>
                  <button
                    type="button"
                    onClick={() => setShowDriveLinkInput(true)}
                    className="text-primary hover:text-primary/90 flex items-center gap-1 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Drive Link
                  </button>
                </div>

                <div className="space-y-4">
                  {showDriveLinkInput && (
                    <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Drive Link
                        </label>
                        <input
                          type="text"
                          value={newDriveLink.url}
                          onChange={(e) => setNewDriveLink({ ...newDriveLink, url: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="https://drive.google.com/..."
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Refresh (days)
                        </label>
                        <input
                          type="number"
                          value={newDriveLink.refresh_rate}
                          onChange={(e) => setNewDriveLink({ ...newDriveLink, refresh_rate: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          min="1"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => addDriveLinkMutation.mutate(newDriveLink)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {driveLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 break-all">{link.link}</p>
                        <p className="text-xs text-gray-500">Refreshes every {link.refresh_rate} days</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteDriveLinkMutation.mutate(link.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Website URLs</h2>
                  <button
                    type="button"
                    onClick={() => setShowWebsiteUrlInput(true)}
                    className="text-primary hover:text-primary/90 flex items-center gap-1 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Website URL
                  </button>
                </div>

                <div className="space-y-4">
                  {showWebsiteUrlInput && (
                    <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website URL
                        </label>
                        <input
                          type="text"
                          value={newWebsiteUrl.url}
                          onChange={(e) => setNewWebsiteUrl({ ...newWebsiteUrl, url: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Refresh (days)
                        </label>
                        <input
                          type="number"
                          value={newWebsiteUrl.refresh_rate}
                          onChange={(e) => setNewWebsiteUrl({ ...newWebsiteUrl, refresh_rate: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          min="1"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => addWebsiteUrlMutation.mutate(newWebsiteUrl)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {websiteUrls.map((url) => (
                    <div key={url.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 break-all">{url.url}</p>
                        <p className="text-xs text-gray-500">Refreshes every {url.refresh_rate} days</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteWebsiteUrlMutation.mutate(url.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              {clientMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Client"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditClient;
