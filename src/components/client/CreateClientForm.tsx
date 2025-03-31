
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
import { createClientActivity } from '@/services/clientActivityService';

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
      
      // Generate a client ID using crypto.randomUUID
      const tempClientId = crypto.randomUUID();
      console.log("Generated client ID:", tempClientId);
      
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      console.log("Generated temporary password:", tempPassword.substring(0, 3) + "...");
      
      toast.loading("Setting up AI agent...", { id: toastId });
      
      // Create AI agent (which also creates the client)
      const result = await ensureAiAgentExists(
        tempClientId,
        data.agent_name || "AI Assistant", // Provide a default if empty
        data.agent_description,
        "", // logoUrl
        "", // logoStoragePath
        data.client_name,
        false // Now we want to log activities
      );
      
      if (result.success) {
        // Store the temporary password - using agent.id instead of agentId
        const agentId = result.agent?.id || tempClientId;
        
        // Log client creation activity
        await createClientActivity(
          agentId,
          data.client_name,
          'client_created',
          `New client ${data.client_name} created with agent ${data.agent_name || "AI Assistant"}`,
          {
            client_id: tempClientId, // Include the client_id in metadata
            email: data.email,
            agent_name: data.agent_name || "AI Assistant",
            agent_description: data.agent_description,
            creation_method: "admin_form"
          }
        );
        
        toast.loading("Configuring client credentials...", { id: toastId });
        
        try {
          const passwordResult = await saveClientTempPassword(
            agentId, 
            data.email,
            tempPassword
          );
          
          // Log credentials setup activity
          await createClientActivity(
            agentId,
            data.client_name,
            'client_updated',
            `Setup login credentials for ${data.client_name}`,
            {
              email: data.email,
              has_temp_password: true
            }
          );
          
          toast.loading("Sending welcome email...", { id: toastId });
          
          // Send welcome email with credentials
          const emailResult = await sendWelcomeEmail(
            data.email,
            data.client_name,
            passwordResult.password || tempPassword // Use password from result if available
          );
          
          if (emailResult.emailSent) {
            // Log email sent activity
            await createClientActivity(
              agentId,
              data.client_name,
              'email_sent',
              `Welcome email sent to ${data.email}`,
              {
                email_type: "welcome",
                recipient: data.email,
                client_name: data.client_name
              }
            );
            
            toast.success("Client created and welcome email sent successfully!", { id: toastId });
          } else {
            // Log email failure
            await createClientActivity(
              agentId,
              data.client_name,
              'error_logged',
              `Failed to send welcome email to ${data.email}`,
              {
                error: emailResult.emailError,
                email_type: "welcome",
                recipient: data.email
              }
            );
            
            toast.warning("Client created but failed to send welcome email", { 
              id: toastId,
              description: emailResult.emailError
            });
            console.error("Failed to send welcome email:", emailResult.emailError);
          }
        } catch (error) {
          console.error("Error setting up client credentials:", error);
          
          // Log credential setup error
          await createClientActivity(
            agentId,
            data.client_name,
            'error_logged',
            `Failed to set up login credentials for ${data.client_name}`,
            {
              error: String(error),
              email: data.email
            }
          );
          
          toast.warning("Client created but failed to set up login credentials", { id: toastId });
        }
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/admin/clients`);
        }
      } else {
        console.error("Failed to create client:", result.error);
        
        // Log client creation error
        await createClientActivity(
          tempClientId,
          data.client_name,
          'error_logged',
          `Failed to create client ${data.client_name}`,
          {
            error: result.error,
            email: data.email,
            agent_name: data.agent_name || "AI Assistant"
          }
        );
        
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
