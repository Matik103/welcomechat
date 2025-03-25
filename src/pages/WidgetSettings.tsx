
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useParams } from 'react-router-dom';
import { useClientData } from '@/hooks/useClientData';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { toast } from 'sonner';
import LogoManagement from '@/components/widget/logo/LogoManagement';
import { supabase } from '@/integrations/supabase/client';
import { useClientActivity } from '@/hooks/useClientActivity';
import { v4 as uuidv4 } from 'uuid';

export default function WidgetSettings() {
  const { clientId } = useParams<{ clientId: string }>();
  const { client, isLoadingClient, error: clientError, refetchClient } = useClientData(clientId);
  const { updateAgentName, updateAgentDescription, updateLogo, isUpdating, error: updateError } = useWidgetSettings(clientId || '');
  const { logClientActivity } = useClientActivity(clientId);
  
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoStoragePath, setLogoStoragePath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (client) {
      setAgentName(client.agent_name || '');
      if (client.widget_settings) {
        setAgentDescription(client.widget_settings.agent_description || '');
        setLogoUrl(client.widget_settings.logo_url || '');
        setLogoStoragePath(client.widget_settings.logo_storage_path || '');
      }
    }
  }, [client]);

  const handleAgentNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) {
      toast.error('Agent name cannot be empty');
      return;
    }
    
    try {
      const result = await updateAgentName(agentName);
      if (result) {
        refetchClient();
      }
    } catch (error: any) {
      toast.error(`Failed to update agent name: ${error.message}`);
    }
  };

  const handleAgentDescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await updateAgentDescription(agentDescription);
      if (result) {
        refetchClient();
      }
    } catch (error: any) {
      toast.error(`Failed to update agent description: ${error.message}`);
    }
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setIsProcessing(true);
    
    try {
      // Generate a unique path for the file
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `logos/${clientId}/${fileName}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('widget-logos')
        .upload(filePath, file);
        
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('widget-logos')
        .getPublicUrl(filePath);
        
      // Update the logo in the database
      await updateLogo(publicUrl, filePath);
      
      // Update local state
      setLogoUrl(publicUrl);
      setLogoStoragePath(filePath);
      
      // Refresh client data
      refetchClient();
      
      // Log activity
      await logClientActivity('logo_uploaded', 'Uploaded new logo for AI assistant', {
        logo_url: publicUrl,
        file_name: file.name,
        file_size: file.size
      });
      
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast.error(`Failed to upload logo: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
    
    // Reset the file input
    event.target.value = '';
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading widget settings...</p>
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Error loading client: {clientError.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <PageHeading>Widget Settings</PageHeading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Name</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAgentNameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Name</Label>
                  <Input
                    id="agentName"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="AI Assistant"
                  />
                </div>
                <Button type="submit" disabled={isUpdating}>Save Name</Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Agent Description</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAgentDescriptionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentDescription">Description</Label>
                  <Textarea
                    id="agentDescription"
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="Describe what your assistant can help with"
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={isUpdating}>Save Description</Button>
              </form>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Agent Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <LogoManagement 
                logoUrl={logoUrl}
                isLoading={isProcessing}
                onLogoChange={handleLogoChange}
                onLogoDelete={async () => {
                  if (logoStoragePath) {
                    try {
                      // Remove the file from storage if it exists
                      await supabase.storage
                        .from('widget-logos')
                        .remove([logoStoragePath]);
                        
                      // Update the database
                      await updateLogo('', '');
                      
                      // Update local state
                      setLogoUrl('');
                      setLogoStoragePath('');
                      
                      // Refresh client data
                      refetchClient();
                      
                      toast.success('Logo removed successfully');
                    } catch (error: any) {
                      toast.error(`Failed to remove logo: ${error.message}`);
                    }
                  } else {
                    // Just clear the URL if no storage path
                    await updateLogo('', '');
                    setLogoUrl('');
                    refetchClient();
                    toast.success('Logo removed successfully');
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
