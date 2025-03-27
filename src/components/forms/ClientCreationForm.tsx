
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

// Form validation schema
const clientFormSchema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  email: z.string().email('Invalid email address'),
  agentName: z.string().min(1, 'Agent name is required'),
  agentDescription: z.string().optional()
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export function ClientCreationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      clientName: '',
      email: '',
      agentName: 'AI Assistant',
      agentDescription: ''
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    setIsLoading(true);
    const createToastId = toast.loading("Creating client...");
    
    try {
      const clientId = uuidv4();
      
      // Create the client record
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          id: clientId,
          client_name: data.clientName,
          email: data.email,
          agent_name: data.agentName,
          widget_settings: {
            agent_name: data.agentName,
            agent_description: data.agentDescription || "",
            client_name: data.clientName,
            email: data.email
          }
        });

      if (clientError) {
        console.error("Error creating client:", clientError);
        throw new Error(clientError.message);
      }

      // Generate temporary password
      const tempPassword = generateTempPassword();
      
      // Call the send-welcome-email edge function
      const { error: emailFnError } = await supabase.functions.invoke(
        'send-welcome-email', 
        {
          body: {
            clientId: clientId,
            clientName: data.clientName,
            email: data.email,
            agentName: data.agentName,
            tempPassword: tempPassword
          }
        }
      );
      
      if (emailFnError) {
        console.error("Email function error:", emailFnError);
        toast.error("Client created but failed to send invitation email", { id: createToastId });
      } else {
        toast.success("Client created successfully and invitation sent", { id: createToastId });
      }
      
      // Reset form and navigate back to clients list
      form.reset();
      navigate('/admin/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client. Please try again.', { id: createToastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a temporary password
  const generateTempPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter client name" {...field} disabled={isLoading} />
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
                  disabled={isLoading} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Agent Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter AI agent name" 
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
          name="agentDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chatbot Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your AI assistant's purpose and personality..."
                  {...field}
                  disabled={isLoading}
                  rows={5}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500 mt-1">
                This description helps define how your AI assistant interacts with users and will be used as the system prompt. Client can set this later.
              </p>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-600">
          {isLoading ? 'Creating...' : 'Create Client'}
        </Button>
      </form>
    </Form>
  );
}
