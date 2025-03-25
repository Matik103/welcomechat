
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { 
  generateClientTempPassword, 
  saveClientTempPassword
} from '@/utils/passwordUtils';
import { createClientUserAccount, logClientCreationActivity } from '@/utils/clientAccountUtils';
import { setupOpenAIAssistant } from '@/utils/clientOpenAIUtils';

// Form validation schema
const clientFormSchema = z.object({
  client_name: z.string().min(2, 'Client name is required'),
  email: z.string().email('Invalid email address'),
  client_id: z.string().optional(),
  agent_name: z.string().min(1, 'Agent name is required'),
  agent_description: z.string().optional()
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
      client_id: uuidv4(),
      agent_name: 'AI Assistant',
      agent_description: ''
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    setIsLoading(true);
    const initialToastId = toast.loading("Creating client...");
    
    try {
      // Ensure client_id exists
      if (!data.client_id) {
        data.client_id = uuidv4();
      }
      
      // Create the client/agent in ai_agents table
      const { data: clientData, error: clientError } = await supabase
        .from('ai_agents')
        .insert({
          client_name: data.client_name,
          email: data.email,
          name: data.agent_name,
          agent_description: data.agent_description || "",
          client_id: data.client_id,
          content: "",
          interaction_type: 'config',
          settings: {
            agent_name: data.agent_name,
            agent_description: data.agent_description || "",
            logo_url: "",
            client_name: data.client_name,
            email: data.email,
            client_id: data.client_id
          }
        })
        .select()
        .single();

      if (clientError) {
        console.error("Error creating client:", clientError);
        throw new Error(clientError.message);
      }
      
      // Generate temporary password for the new client
      const tempPassword = generateClientTempPassword();
      
      // Save the temporary password
      await saveClientTempPassword(clientData.id, data.email, tempPassword);
      
      // Create the user account in Supabase Auth
      await createClientUserAccount(
        data.email,
        data.client_id,
        data.client_name,
        data.agent_name,
        data.agent_description || "",
        tempPassword
      );
      
      // Log activity for client creation
      await logClientCreationActivity(
        data.client_id,
        data.client_name,
        data.email,
        data.agent_name
      );
      
      // Setup OpenAI assistant for this client
      await setupOpenAIAssistant(
        data.client_id,
        data.agent_name,
        data.agent_description || "",
        data.client_name
      );
      
      // Update toast to show we're sending welcome email
      toast.loading("Sending welcome email...", { id: initialToastId });
      
      // Call the send-welcome-email edge function
      const { data: emailResult, error: emailFnError } = await supabase.functions.invoke(
        'send-welcome-email', 
        {
          body: {
            clientId: data.client_id,
            clientName: data.client_name,
            email: data.email,
            agentName: data.agent_name,
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
      {/* Hidden field for client_id */}
      <input 
        type="hidden" 
        {...form.register('client_id')} 
      />
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="client_name" className="text-sm font-medium">Client Name</Label>
          <Input
            id="client_name"
            {...form.register('client_name')}
            className="mt-1"
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
          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            className="mt-1"
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
          <Label htmlFor="agent_name" className="text-sm font-medium">AI Agent Name</Label>
          <Input
            id="agent_name"
            {...form.register('agent_name')}
            className="mt-1"
            placeholder="Enter AI agent name"
            disabled={isLoading}
          />
          {form.formState.errors.agent_name && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.agent_name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="agent_description" className="text-sm font-medium">Chatbot Description</Label>
          <Textarea
            id="agent_description"
            {...form.register('agent_description')}
            className="mt-1"
            placeholder="Describe your AI assistant's purpose and personality..."
            disabled={isLoading}
            rows={5}
          />
          <p className="text-xs text-gray-500 mt-1">
            This description helps define how your AI assistant interacts with users and will be used as the system prompt. Client can set this later.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-600">
        {isLoading ? 'Creating...' : 'Create Client'}
      </Button>
    </form>
  );
}
