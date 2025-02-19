
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AddEditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [aiAgentName, setAiAgentName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteUrlRefreshRate, setWebsiteUrlRefreshRate] = useState(30);
  const [driveLink, setDriveLink] = useState("");
  const [driveLinkRefreshRate, setDriveLinkRefreshRate] = useState(30);

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
          setWebsiteUrl(data.website_url || "");
          setWebsiteUrlRefreshRate(data.website_url_refresh_rate || 30);
          setDriveLink(data.drive_link || "");
          setDriveLinkRefreshRate(data.drive_link_refresh_rate || 30);
        }
      }
    }
  });

  // Add/Update client mutation
  const clientMutation = useMutation({
    mutationFn: async (data: {
      full_name: string;
      email: string;
      agent_name: string;
      website_url?: string;
      website_url_refresh_rate?: number;
      drive_link?: string;
      drive_link_refresh_rate?: number;
    }) => {
      const payload = {
        ...data,
        website_url_added_at: data.website_url ? new Date().toISOString() : null,
        drive_link_added_at: data.drive_link ? new Date().toISOString() : null,
      };

      if (id) {
        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        return id;
      } else {
        const { data: newClient, error } = await supabase
          .from("clients")
          .insert([payload])
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      full_name: fullName,
      email,
      agent_name: aiAgentName,
      website_url: websiteUrl || null,
      website_url_refresh_rate: websiteUrlRefreshRate,
      drive_link: driveLink || null,
      drive_link_refresh_rate: driveLinkRefreshRate,
    };
    clientMutation.mutate(payload);
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Website URL</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label htmlFor="websiteUrlRefreshRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Rate (days)
                </label>
                <input
                  id="websiteUrlRefreshRate"
                  type="number"
                  value={websiteUrlRefreshRate}
                  onChange={(e) => setWebsiteUrlRefreshRate(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  min="1"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Drive Link</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="driveLink" className="block text-sm font-medium text-gray-700 mb-1">
                  Drive Link
                </label>
                <input
                  id="driveLink"
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div>
                <label htmlFor="driveLinkRefreshRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Rate (days)
                </label>
                <input
                  id="driveLinkRefreshRate"
                  type="number"
                  value={driveLinkRefreshRate}
                  onChange={(e) => setDriveLinkRefreshRate(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  min="1"
                />
              </div>
            </div>
          </div>

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
