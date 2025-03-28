
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClientFormData } from '@/types/client-form';
import { Client } from '@/types/client';
import { Loader2 } from 'lucide-react';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { LogoManagement } from '@/components/widget/LogoManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadLogo } from '@/services/uploadService';

// Define the schema for form validation
const clientFormSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address'),
  agent_name: z.string().min(1, 'Agent name is required'),
  agent_description: z.string().optional(),
});

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  submitButtonText?: string;
}

export function ClientForm({
  initialData,
  onSubmit,
  isLoading = false,
  error,
  submitButtonText = 'Save Changes'
}: ClientFormProps) {
  const [logoUrl, setLogoUrl] = useState<string>(initialData?.logo_url || '');
  const [logoStoragePath, setLogoStoragePath] = useState<string>(initialData?.logo_storage_path || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formError, setFormError] = useState<string | null>(error || null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: initialData?.client_name || '',
      email: initialData?.email || '',
      agent_name: initialData?.agent_name || initialData?.name || '',
      agent_description: initialData?.agent_description || '',
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploadingLogo(true);
      setFormError(null);
      
      // Use clientId if available, otherwise use 'new' as a placeholder
      const effectiveClientId = initialData?.client_id || 'new';
      
      // Upload the logo using the uploadLogo service
      const result = await uploadLogo(file, effectiveClientId);
      
      // Update state with the new logo URL
      setLogoUrl(result.url);
      setLogoStoragePath(result.path);
      
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      setFormError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoStoragePath) return;
    
    try {
      setIsUploadingLogo(true);
      
      // Parse the storage path to get the bucket and file path
      const pathParts = logoStoragePath.split('/');
      const bucket = 'client-assets';
      const filePath = logoStoragePath;
      
      // Delete the file from storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
        
      if (error) {
        toast.error(`Failed to remove logo: ${error.message}`);
        throw error;
      }
      
      // Clear the logo URL and path
      setLogoUrl('');
      setLogoStoragePath('');
      
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Error removing logo:', error);
      setFormError(`Failed to remove logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const processFormSubmit = async (data: ClientFormData) => {
    try {
      setFormError(null);
      // Include logo URL and storage path in the form data
      await onSubmit({
        ...data,
        logo_url: logoUrl,
        logo_storage_path: logoStoragePath
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormError(`Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(processFormSubmit)} className="space-y-6">
      {(formError || error) && <FormErrorMessage message={formError || error} />}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client_name">Client Name</Label>
          <Input
            id="client_name"
            {...register('client_name')}
            className={errors.client_name ? 'border-red-500' : ''}
          />
          {errors.client_name && (
            <p className="text-sm text-red-500">{errors.client_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent_name">AI Agent Name</Label>
          <Input
            id="agent_name"
            {...register('agent_name')}
            className={errors.agent_name ? 'border-red-500' : ''}
          />
          {errors.agent_name && (
            <p className="text-sm text-red-500">{errors.agent_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent_description">AI Agent Description</Label>
          <Textarea
            id="agent_description"
            {...register('agent_description')}
            className={errors.agent_description ? 'border-red-500' : ''}
            placeholder="Describe what this AI agent does..."
            rows={4}
          />
          {errors.agent_description && (
            <p className="text-sm text-red-500">{errors.agent_description.message}</p>
          )}
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
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button 
          type="submit" 
          disabled={isLoading || isUploadingLogo}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}
