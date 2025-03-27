
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/integrations/supabase/client-admin';
import { generateTempPassword } from '@/utils/passwordUtils';

interface SimpleClientFormProps {
  redirectPath?: string;
}

export function SimpleClientForm({ redirectPath }: SimpleClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [agentName, setAgentName] = useState('AI Assistant');
  const [agentDescription, setAgentDescription] = useState('');
  const navigate = useNavigate();

  // Simple validation function
  const validateForm = () => {
    if (!clientName || clientName.length < 2) {
      toast.error('Client name is required (minimum 2 characters)');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error('Valid email address is required');
      return false;
    }
    
    if (!agentName) {
      toast.error('AI agent name is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating client account...");
    
    try {
      // Generate a client ID
      const clientId = uuidv4();
      
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      
      console.log("Creating client with supabaseAdmin, service key exists:", 
                 !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
      
      // Create the client record in ai_agents table using supabaseAdmin to bypass RLS
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from('ai_agents')
        .insert({
          id: clientId,
          client_id: clientId,
          client_name: clientName,
          email: email,
          name: agentName,
          agent_description: agentDescription || "",
          interaction_type: "config", // Required field
          status: "active", // Required field
          settings: {
            agent_name: agentName,
            agent_description: agentDescription || "",
            client_name: clientName,
            email: email,
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
      
      // Note: client_activities table has been removed, so we no longer log activities here
      
      // Send welcome email with Resend.com through edge function
      const { data: emailResult, error: emailError } = await supabaseAdmin.functions.invoke(
        'send-welcome-email', 
        {
          body: {
            clientId: clientId,
            clientName: clientName,
            email: email,
            agentName: agentName,
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
      setClientName('');
      setEmail('');
      setAgentName('AI Assistant');
      setAgentDescription('');
      
      // Navigate to the specified redirect path
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="client_name">Client Name</Label>
        <Input
          id="client_name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Enter client name"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="agent_name">AI Agent Name</Label>
        <Input
          id="agent_name"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Enter AI agent name"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="agent_description">AI Agent Description</Label>
        <Textarea
          id="agent_description"
          value={agentDescription}
          onChange={(e) => setAgentDescription(e.target.value)}
          placeholder="Describe your AI assistant's purpose and personality..."
          disabled={isSubmitting}
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Client'}
      </Button>
    </form>
  );
}
