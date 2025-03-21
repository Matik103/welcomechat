
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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
      
      // Update toast to show we're sending welcome email
      toast.loading("Sending welcome email...", { id: initialToastId });
      
      // Call the send-welcome-email edge function
      const { data: emailResult, error: emailFnError } = await supabase.functions.invoke(
        'send-welcome-email', 
        {
          body: {
            clientId: clientData.id,
            clientName: data.client_name,
            email: data.email,
            agentName: data.widget_settings?.agent_name || "AI Assistant",
            tempPassword: tempPassword
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

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Client'}
      </Button>
    </form>
  );
}
