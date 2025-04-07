
import { useState } from 'react';
import { Client } from '@/types/client';
import { WidgetSection } from '@/components/client/settings/WidgetSection';
import { WidgetSettings } from '@/types/widget-settings';
import { Button } from '@/components/ui/button';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { Loader2 } from 'lucide-react';

interface WidgetSettingsFormProps {
  initialData: Client | null | undefined;
  onSubmit: (data: Partial<WidgetSettings>) => Promise<void>;
  isLoading?: boolean;
  isClientView?: boolean;
}

export function WidgetSettingsForm({ 
  initialData, 
  onSubmit, 
  isLoading = false,
  isClientView = false
}: WidgetSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const clientId = initialData?.id || initialData?.client_id || '';
  
  // Use the widget settings hook to manage logo uploads and settings
  const { 
    settings, 
    isUploading,
    updateLogo
  } = useWidgetSettings(clientId);
  
  // Initialize local state with settings from props or hook
  const [formData, setFormData] = useState<WidgetSettings>({
    ...(initialData?.widget_settings as WidgetSettings || settings)
  });

  const handleSettingsChange = (newSettings: Partial<WidgetSettings>) => {
    setFormData(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    
    try {
      // Generate a unique file path
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const filePath = `logos/${clientId}/${fileName}`;
      
      // Create a FormData object to upload the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', filePath);
      
      // Upload file to storage
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }
      
      const data = await response.json();
      
      // Update logo in settings
      if (data.url) {
        await updateLogo(data.url, filePath);
        handleSettingsChange({
          logo_url: data.url,
          logo_storage_path: filePath
        });
      }
      
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await onSubmit(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <WidgetSection
        settings={formData}
        isUploading={isUploading}
        onSettingsChange={handleSettingsChange}
        onLogoUpload={handleLogoUpload}
      />
      
      <Button 
        type="submit"
        disabled={saving || isLoading}
        className="w-full"
      >
        {(saving || isLoading) && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Save Widget Settings
      </Button>
    </form>
  );
}
