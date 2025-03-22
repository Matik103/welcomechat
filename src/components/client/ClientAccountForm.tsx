
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { LogoUpload } from '@/components/client/LogoUpload';

// Client form schema
const clientFormSchema = z.object({
  client_name: z.string().min(2, "Client name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  agent_name: z.string().min(2, "Agent name must be at least 2 characters").default("AI Assistant"),
  agent_description: z.string().optional(),
  _tempLogoFile: z.any().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientAccountFormProps {
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading: boolean;
}

export const ClientAccountForm = ({ onSubmit, isLoading }: ClientAccountFormProps) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: '',
      email: '',
      agent_name: 'AI Assistant',
      agent_description: '',
      _tempLogoFile: null,
    },
  });

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    form.setValue('_tempLogoFile', file);
  };

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      // Include the logo file in the submission
      const formData = {
        ...data,
        _tempLogoFile: logoFile,
      };
      
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="client_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Client Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter client name" 
                    className="h-10"
                    {...field} 
                    disabled={isLoading}
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
                <FormLabel className="text-base font-medium">Email Address *</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter email address" 
                    className="h-10"
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">AI Assistant Settings</h3>
            
            <FormField
              control={form.control}
              name="agent_name"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel className="text-base font-medium">Assistant Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter assistant name" 
                      className="h-10"
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agent_description"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel className="text-base font-medium">Assistant Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter assistant description" 
                      className="min-h-[100px] resize-y"
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mb-6">
              <FormLabel className="text-base font-medium block mb-2">Assistant Logo</FormLabel>
              <Card className="border border-gray-200">
                <CardContent className="p-4">
                  <LogoUpload onLogoChange={handleLogoChange} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full mt-6"
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Client Account"}
        </Button>
      </form>
    </Form>
  );
};
