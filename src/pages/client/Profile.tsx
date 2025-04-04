
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateClient, getClient } from '@/services/administrationService';
import { useClientActivity } from '@/hooks/useClientActivity';
import { ActivityType } from "@/types/activity";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const { logClientActivity } = useClientActivity(clientId);

  useEffect(() => {
    if (user?.user_metadata?.client_id) {
      setClientId(user.user_metadata.client_id);
      fetchClientData(user.user_metadata.client_id);
    }
  }, [user]);

  const fetchClientData = async (clientId: string) => {
    try {
      const { data, error } = await getClient(clientId);
      if (error) {
        console.error("Error fetching client data:", error);
        toast.error("Failed to load client data");
        return;
      }
      if (data) {
        setFormData({
          name: data.client_name || '',
          email: data.email || '',
        });
      }
    } catch (error) {
      console.error("Exception fetching client data:", error);
      toast.error("Failed to load client data");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!clientId) {
        toast.error("Client ID is missing.");
        return;
      }

      const { success, error } = await updateClient(clientId, {
        name: formData.name,
        email: formData.email,
      });

      if (success) {
        toast.success("Profile updated successfully!");
        await logClientActivity(
          ActivityType.PROFILE_UPDATED,
          "Profile information updated",
          { updated_fields: Object.keys(formData) }
        );
      } else {
        console.error("Profile update failed:", error);
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Exception updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <form onSubmit={handleUpdateProfile} className="max-w-md">
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
            />
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Profile"}
        </Button>
      </form>
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mt-4"
      >
        Cancel
      </Button>
    </div>
  );
}
