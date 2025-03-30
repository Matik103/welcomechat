
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';
import { Client } from '@/types/client';
import { useClientData } from '@/hooks/useClientData';
import { supabase } from '@/integrations/supabase/client';
import { LogoManagement } from '@/components/widget/LogoManagement';
import { uploadLogo } from '@/services/uploadService';
import { User as AuthUser } from '@supabase/supabase-js';

interface ProfileSectionProps {
  client: Client | null;
  user: AuthUser | null;
  isLoading?: boolean;
  onProfileUpdated?: () => void;
}

export function ProfileSection({ client, user, isLoading = false, onProfileUpdated }: ProfileSectionProps) {
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoStoragePath, setLogoStoragePath] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const clientId = user?.user_metadata?.client_id || '';
  const { clientMutation } = useClientData(clientId);

  // Initialize form with user and client data
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
    
    if (client) {
      setClientName(client.client_name || '');
      setAgentName(client.agent_name || client.name || '');
      setDescription(client.agent_description || client.description || '');
      setLogoUrl(client.logo_url || '');
      setLogoStoragePath(client.logo_storage_path || '');
    }
  }, [user, client]);

  const handleUpdateUserProfile = async () => {
    if (!user) return;
    
    try {
      setUpdatingProfile(true);
      
      // Update Supabase auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      
      if (authError) throw authError;
      
      // Only update email if it has changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });
        
        if (emailError) throw emailError;
        toast.success("Email update initiated. Please check your inbox for confirmation.");
      }
      
      // Update client record
      if (client && clientId) {
        await clientMutation.mutateAsync({
          client_id: clientId,
          client_name: clientName,
          email: email,
          agent_name: agentName,
          agent_description: description,
          logo_url: logoUrl,
          logo_storage_path: logoStoragePath
        });
      }
      
      toast.success("Profile updated successfully");
      if (onProfileUpdated) onProfileUpdated();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !clientId) return;
    
    try {
      setIsUploadingLogo(true);
      
      const result = await uploadLogo(file, clientId);
      
      setLogoUrl(result.url);
      setLogoStoragePath(result.path);
      
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoStoragePath) return;
    
    try {
      setIsUploadingLogo(true);
      
      const bucket = 'bot-logos';
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([logoStoragePath]);
        
      if (error) throw error;
      
      setLogoUrl('');
      setLogoStoragePath('');
      
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error(`Failed to remove logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateUserProfile(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientName">Company/Organization Name</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Your company or organization name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agentName">AI Assistant Name</Label>
            <Input
              id="agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Name of your AI assistant"
            />
            <p className="text-sm text-muted-foreground">
              This is the name that will be displayed to users interacting with your AI assistant
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">AI Assistant Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your AI assistant does"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Logo</Label>
            <LogoManagement
              logoUrl={logoUrl}
              isUploading={isUploadingLogo}
              onLogoUpload={handleLogoUpload}
              onRemoveLogo={handleRemoveLogo}
            />
          </div>
          
          <Button 
            type="submit" 
            className="mt-4"
            disabled={updatingProfile || isUploadingLogo}
          >
            {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
