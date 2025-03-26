
import React, { useState } from 'react';
import { clientFormSchema, ClientFormData } from '@/types/client-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  error?: string | null;
  isClientView?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  submitButtonText = 'Save',
  error,
  isClientView = false
}) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData.widget_settings?.logo_url || null
  );
  
  const formSchema = z.object({
    client_id: z.string().optional(),
    client_name: z.string().min(1, "Client name is required"),
    email: z.string().email("Invalid email address"),
    company: z.string().optional(),
    description: z.string().optional(),
    widget_settings: z.object({
      agent_name: z.string().optional(),
      agent_description: z.string().optional(),
      logo_url: z.string().optional(),
      logo_storage_path: z.string().optional()
    }).optional(),
    _tempLogoFile: z.any().optional()
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<ClientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: initialData.client_id,
      client_name: initialData.client_name || '',
      email: initialData.email || '',
      company: initialData.company || '',
      description: initialData.description || '',
      widget_settings: {
        agent_name: initialData.widget_settings?.agent_name || '',
        agent_description: initialData.widget_settings?.agent_description || '',
        logo_url: initialData.widget_settings?.logo_url || '',
        logo_storage_path: initialData.widget_settings?.logo_storage_path || ''
      }
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('_tempLogoFile', file);
      
      // Create a preview for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmit = async (data: ClientFormData) => {
    try {
      await onSubmit(data);
      // Don't reset form after successful submission to maintain state
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                placeholder="Enter client name"
                {...register('client_name')}
                disabled={isLoading}
              />
              {errors.client_name && (
                <p className="text-sm text-red-500">{errors.client_name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Enter company name"
                {...register('company')}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter description"
                {...register('description')}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent_name">AI Agent Name</Label>
              <Input
                id="agent_name"
                placeholder="Enter AI agent name"
                {...register('widget_settings.agent_name')}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent_description">AI Agent Description</Label>
              <Input
                id="agent_description"
                placeholder="Enter AI agent description"
                {...register('widget_settings.agent_description')}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="h-16 w-16 rounded-md overflow-hidden">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
