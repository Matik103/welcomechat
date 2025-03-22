
import { useState } from 'react';
import { useNewClientForm } from "@/hooks/useNewClientForm";
import { ClientFormData } from "@/types/client-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from 'sonner';

interface NewClientFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<ClientFormData>;
}

export function NewClientForm({ onSubmit, isSubmitting = false, initialData }: NewClientFormProps) {
  const { form, handleSubmit, errors, handleLogoChange } = useNewClientForm({ 
    onSubmit: async (data) => {
      await onSubmit(data);
    }, 
    initialData 
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleLogoChange(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter client name" 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter email address" 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">Assistant Settings</h3>
          
          <FormField
            control={form.control}
            name="widget_settings.agent_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assistant Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter assistant name" 
                    {...field} 
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="widget_settings.agent_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assistant Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter assistant description" 
                    {...field} 
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="logo">AI Agent Logo</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              {logoPreview && (
                <div className="h-12 w-12 rounded overflow-hidden border">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload a logo image for the AI assistant. Recommended size: 128x128px.
            </p>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Add New Client"}
      </Button>
    </form>
  );
}
