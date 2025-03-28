
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAiAgentManagement } from '@/hooks/useAiAgentManagement';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { generateTempPassword } from '@/utils/passwordUtils';
import { sendWelcomeEmail } from '@/utils/email/welcomeEmail';
import { saveClientTempPassword } from '@/utils/passwordUtils';

// Schema with optional chatbot fields
const createClientSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  agent_name: z.string().optional(),
  agent_description: z.string().optional()
});

type CreateClientFormValues = z.infer<typeof createClientSchema>;

interface CreateClientFormProps {
  onSuccess?: () => void;
}

const CreateClientForm: React.FC<CreateClientFormProps> = ({ onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ensureAiAgentExists } = useAiAgentManagement();
  const navigate = useNavigate();

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      client_name: "",
      email: "",
      agent_name: "AI Assistant",
      agent_description: ""
    }
  });

  const handleSubmit = async (data: CreateClientFormValues) => {
    let toastId = toast.loading("Creating client...");
    
    try {
      setIsSubmitting(true);
      
      // Generate a client ID (would normally come from the backend)
      const tempClientId = crypto.randomUUID();
      
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      console.log("Generated temporary password:", tempPassword.substring(0, 3) + "...");
      
      toast.loading("Setting up AI agent...", { id: toastId });
      
      // Create AI agent (which also creates the client) but disable activity logging
      const result = await ensureAiAgentExists(
        tempClientId,
        data.agent_name || "AI Assistant", // Provide a default if empty
        data.agent_description,
        "", // logoUrl
        "", // logoStoragePath
        data.client_name,
        true // skipActivityLog - ensure we skip activity logging
      );
      
      if (result.success) {
        // Store the temporary password - using agent.id instead of agentId
        const agentId = result.agent?.id || tempClientId;
        
        toast.loading("Configuring client credentials...", { id: toastId });
        
        try {
          const passwordResult = await saveClientTempPassword(
            agentId, 
            data.email,
            tempPassword
          );
          
          toast.loading("Sending welcome email...", { id: toastId });
          
          // Send welcome email with credentials
          const emailResult = await sendWelcomeEmail(
            data.email,
            data.client_name,
            passwordResult.password || tempPassword // Use password from result if available
          );
          
          if (emailResult.emailSent) {
            toast.success("Client created and welcome email sent successfully!", { id: toastId });
          } else {
            toast.warning("Client created but failed to send welcome email", { 
              id: toastId,
              description: emailResult.emailError
            });
            console.error("Failed to send welcome email:", emailResult.emailError);
          }
        } catch (error) {
          console.error("Error setting up client credentials:", error);
          toast.warning("Client created but failed to set up login credentials", { id: toastId });
        }
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/admin/clients`);
        }
      } else {
        console.error("Failed to create client:", result.error);
        toast.error("Failed to create client", { 
          id: toastId,
          description: result.error 
        });
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("An error occurred while creating the client", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter client name" {...field} />
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
                <Input type="email" placeholder="client@example.com" {...field} />
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
              <FormLabel>Chatbot Name</FormLabel>
              <FormControl>
                <Input placeholder="AI Assistant" {...field} />
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
              <FormLabel>Chatbot Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what this chatbot does" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Client"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateClientForm;
