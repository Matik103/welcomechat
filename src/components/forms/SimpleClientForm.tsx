
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { generateTempPassword } from '@/utils/passwordUtils';

// Form validation schema
const clientFormSchema = z.object({
  client_name: z.string().min(2, 'Client name is required'),
  email: z.string().email('Invalid email address'),
  agent_name: z.string().min(1, 'AI agent name is required'),
  agent_description: z.string().optional()
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface SimpleClientFormProps {
  redirectPath?: string;
}

export function SimpleClientForm({ redirectPath }: SimpleClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: '',
      email: '',
      agent_name: 'AI Assistant',
      agent_description: ''
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating client account...");
    
    try {
      // Generate a client ID
      const clientId = uuidv4();
      
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      
      // Create the client record in ai_agents table
      const { data: clientData, error: clientError } = await supabase
        .from('ai_agents')
        .insert({
          id: clientId,
          client_id: clientId,
          client_name: data.client_name,
          email: data.email,
          name: data.agent_name,
          agent_description: data.agent_description || "",
          settings: {
            agent_name: data.agent_name,
            agent_description: data.agent_description || "",
            client_name: data.client_name,
            email: data.email,
            client_id: clientId,
            tempPassword: tempPassword,
            tempPasswordSetAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (clientError) {
        console.error("Error creating client:", clientError);
        throw new Error(clientError.message);
      }
      
      // Log activity - Use 'client_created' instead of 'agent_created' as it's a valid enum value
      const { error: activityError } = await supabase
        .from('client_activities')
        .insert({
          client_id: clientId,
          activity_type: 'client_created', // Changed from 'agent_created' to 'client_created'
          description: `New client created with AI agent: ${data.agent_name}`,
          metadata: {
            client_name: data.client_name,
            agent_name: data.agent_name,
            email: data.email
          }
        });

      if (activityError) {
        console.error("Error logging activity:", activityError);
        // Continue even if activity logging fails
      }
      
      // Send welcome email with Resend.com through edge function
      const { data: emailResult, error: emailError } = await supabase.functions.invoke(
        'send-welcome-email', 
        {
          body: {
            clientId: clientId,
            clientName: data.client_name,
            email: data.email,
            agentName: data.agent_name,
            tempPassword: tempPassword,
            fromEmail: 'admin@welcome.chat'
          }
        }
      );
      
      if (emailError) {
        console.error("Error sending welcome email:", emailError);
        toast.error("Client created but failed to send welcome email", { id: loadingToast });
      } else if (emailResult && !emailResult.success) {
        console.error("Welcome email sending failed:", emailResult.error);
        toast.error("Client created but welcome email failed to send", { id: loadingToast });
      } else {
        toast.success("Client created successfully and welcome email sent", { id: loadingToast });
      }
      
      // Reset form
      form.reset();
      
      // Navigate to the specified redirect path
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client. Please try again.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
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
              <FormLabel>Email Address</FormLabel>
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

        <FormField
          control={form.control}
          name="agent_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Agent Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter AI agent name"
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
          name="agent_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Agent Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your AI assistant's purpose and personality..."
                  {...field}
                  disabled={isSubmitting}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating...' : 'Create Client'}
        </Button>
      </form>
    </Form>
  );
}
