
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useClientFormSubmission } from '@/hooks/useClientFormSubmission';
import { createClientActivity } from '@/services/clientActivityService';
import { supabase } from '@/integrations/supabase/client';
import { generateTempPassword, saveClientTempPassword } from '@/utils/clientCreationUtils';
import { useNavigate } from 'react-router-dom';

// Form validation schema
const clientFormSchema = z.object({
  client_name: z.string().min(2, 'Client name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  description: z.string().optional(),
  widget_settings: z.object({
    agent_name: z.string().optional(),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional(),
  }).optional(),
  _tempLogoFile: z.any().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export function NewClientForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: '',
      email: '',
      company: '',
      description: '',
      widget_settings: {
        agent_name: '',
        agent_description: '',
      },
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    setIsLoading(true);
    const initialToastId = toast.loading("Creating client...");
    
    try {
      // Create the client/agent in ai_agents table
      const { data: clientData, error: clientError } = await supabase
        .from('ai_agents')
        .insert({
          client_name: data.client_name,
          email: data.email,
          company: data.company || null,
          name: data.widget_settings?.agent_name || "AI Assistant",
          agent_description: data.widget_settings?.agent_description || "",
          content: "",
          interaction_type: 'config',
          settings: {
            agent_name: data.widget_settings?.agent_name || "AI Assistant",
            agent_description: data.widget_settings?.agent_description || "",
            logo_url: data.widget_settings?.logo_url || "",
            client_name: data.client_name,
            email: data.email,
            company: data.company || null
          }
        })
        .select()
        .single();

      if (clientError) throw new Error(clientError.message);
      
      // Log activity for client creation
      await createClientActivity(
        clientData.id,
        "client_created",
        `New client created: ${data.client_name}`,
        {
          client_name: data.client_name,
          email: data.email,
          agent_name: data.widget_settings?.agent_name || "AI Assistant"
        }
      );
      
      // Generate temporary password for the new client
      const tempPassword = generateTempPassword();
      
      // Save the temporary password
      await saveClientTempPassword(clientData.id, data.email, tempPassword);
      
      // Direct edge function call to send welcome email
      toast.loading("Sending welcome email...", { id: initialToastId });
      
      // Call the send-email edge function directly, similar to DeleteClientDialog approach
      const { data: emailResult, error: emailFnError } = await supabase.functions.invoke(
        'send-email', 
        {
          body: {
            to: data.email,
            subject: "Welcome to Welcome.Chat - Your Account Details",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #4f46e5;">Welcome to Welcome.Chat!</h1>
                </div>
                
                <p>Hello ${data.client_name || 'Client'},</p>
                
                <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Email Address:</strong></p>
                  <p style="color: #4f46e5;">${data.email || ''}</p>
                  
                  <p><strong>Temporary Password:</strong></p>
                  <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${tempPassword || ''}</p>
                </div>
                
                <p>To get started:</p>
                <ol>
                  <li>Click the "Sign In" button below</li>
                  <li>Enter your email and temporary password exactly as shown above</li>
                  <li>You'll be taken to your client dashboard</li>
                  <li>Configure your AI assistant's settings</li>
                </ol>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://welcomeai.io/client/auth" 
                     style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Sign In
                  </a>
                </div>
                
                <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
                  <p><strong>Security Notice:</strong></p>
                  <p>This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
                </div>
                
                <p>Best regards,<br>The Welcome.Chat Team</p>
                
                <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                  © ${new Date().getFullYear()} Welcome.Chat. All rights reserved.
                </div>
              </div>
            `,
            from: "Welcome.Chat <admin@welcome.chat>"
          }
        }
      );
      
      if (emailFnError) {
        console.error("Email function error:", emailFnError);
        toast.error("Client created but failed to send invitation email", { id: initialToastId });
      } else if (emailResult && !emailResult.success) {
        console.error("Email sending failed:", emailResult.error);
        toast.error("Client created but invitation email failed to send", { id: initialToastId });
      } else {
        toast.success("Client created successfully and invitation sent", { id: initialToastId });
      }
      
      // Reset form and navigate back to clients list
      form.reset();
      navigate('/admin/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client. Please try again.', { id: initialToastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="client_name">Client Name *</Label>
          <Input
            id="client_name"
            {...form.register('client_name')}
            placeholder="Enter client name"
            disabled={isLoading}
          />
          {form.formState.errors.client_name && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.client_name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder="Enter email address"
            disabled={isLoading}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            {...form.register('company')}
            placeholder="Enter company name"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Enter client description"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">Assistant Settings (Optional)</h3>
          
          <div>
            <Label htmlFor="agent_name">Assistant Name</Label>
            <Input
              id="agent_name"
              {...form.register('widget_settings.agent_name')}
              placeholder="Enter assistant name"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="agent_description">Assistant Description</Label>
            <Textarea
              id="agent_description"
              {...form.register('widget_settings.agent_description')}
              placeholder="Enter assistant description"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Client'}
      </Button>
    </form>
  );
}
