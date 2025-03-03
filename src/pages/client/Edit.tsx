
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { DriveLinks } from "@/components/client/DriveLinks";
import { useDriveLinks } from "@/hooks/useDriveLinks";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { WebsiteUrl, DriveLink } from "@/types/client";

const ClientEdit = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState<{
    id: string;
    client_name: string;
    email: string;
    agent_name: string;
  } | null>(null);

  const {
    websiteUrls,
    isLoading: isLoadingUrls,
    addWebsiteUrl,
    deleteWebsiteUrl,
    isAddingUrl,
    isDeletingUrl,
  } = useWebsiteUrls(clientData?.id);

  const {
    driveLinks,
    isLoading: isLoadingDriveLinks,
    addDriveLink,
    deleteDriveLink,
    isAddingLink,
    isDeletingLink,
  } = useDriveLinks(clientData?.id);

  const [formData, setFormData] = useState({
    client_name: "",
    email: "",
    agent_name: "",
  });

  useEffect(() => {
    const fetchClientData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("clients")
          .select("id, client_name, email, agent_name")
          .eq("user_id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setClientData(data);
          setFormData({
            client_name: data.client_name || "",
            email: data.email || "",
            agent_name: data.agent_name || "",
          });
        }
      } catch (error: any) {
        toast.error("Error fetching client data");
        console.error("Error fetching client data:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientData?.id) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("clients")
        .update({
          client_name: formData.client_name,
          email: formData.email,
          agent_name: formData.agent_name,
        })
        .eq("id", clientData.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error("Error updating profile");
      console.error("Error updating profile:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapper functions to fix the type issues
  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    if (!clientData?.id) return;
    await addWebsiteUrl(data);
  };

  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    if (!clientData?.id) return;
    await addDriveLink(data);
  };

  if (isLoading && !clientData) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Edit Profile</h1>
        <p className="text-gray-500">Update your account information and AI assistant settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your basic account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  AI Assistant Name
                </label>
                <Input
                  type="text"
                  name="agent_name"
                  value={formData.agent_name}
                  onChange={handleChange}
                  placeholder="My Assistant"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
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
          <CardDescription>
            Add websites for your AI assistant to crawl and learn from
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUrls ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <WebsiteUrls
              urls={websiteUrls}
              onAdd={handleAddWebsiteUrl}
              onDelete={deleteWebsiteUrl}
              isAddLoading={isAddingUrl}
              isDeleteLoading={isDeletingUrl}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Drive Links</CardTitle>
          <CardDescription>
            Connect Google Drive documents to your AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDriveLinks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <DriveLinks
              driveLinks={driveLinks}
              onAdd={handleAddDriveLink}
              onDelete={deleteDriveLink}
              isAddLoading={isAddingLink}
              isDeleteLoading={isDeletingLink}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientEdit;
