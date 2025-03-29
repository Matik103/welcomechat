
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAiAgentManagement } from "@/hooks/useAiAgentManagement";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateTempPassword, saveClientTempPassword } from "@/utils/passwordUtils";
import { sendWelcomeEmail } from "@/utils/email/welcomeEmail";
import { createClientActivity } from "@/services/clientActivityService";

// Unified schema with optional fields
const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  agent_name: z.string().optional(),
  agent_description: z.string().optional()
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface UnifiedClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnifiedClientModal({ isOpen, onClose }: UnifiedClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { ensureAiAgentExists } = useAiAgentManagement();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: "",
      email: "",
      agent_name: "AI Assistant",
      agent_description: ""
    }
  });

  const handleSubmit = async (data: ClientFormValues) => {
    const toastId = toast.loading("Creating client...");
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      console.log("Generated temporary password:", tempPassword.substring(0, 3) + "...");
      
      // Create AI agent (which also creates the client)
      const result = await ensureAiAgentExists(
        crypto.randomUUID(), // Generate a client ID
        data.agent_name || "AI Assistant",
        data.agent_description,
        "", // logoUrl
        "", // logoStoragePath
        data.client_name,
        false // Log activities
      );
      
      if (result.success) {
        // Store the temporary password
        const agentId = result.agent?.id || "";
        
        try {
          // Log client creation activity
          await createClientActivity(
            agentId,
            data.client_name,
            'client_created',
            `New client ${data.client_name} created with agent ${data.agent_name || "AI Assistant"}`,
            {
              email: data.email,
              agent_name: data.agent_name || "AI Assistant",
              agent_description: data.agent_description,
              creation_method: "admin_form"
            }
          );
          
          toast.loading("Configuring client credentials...", { id: toastId });
          
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
        
        onClose();
        navigate(`/admin/clients`);
      } else {
        console.error("Failed to create client:", result.error);
        setError(result.error || "Failed to create client");
        
        // Log client creation error
        await createClientActivity(
          "", // No agent ID since creation failed
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
    } catch (error: any) {
      console.error("Error creating client:", error);
      setError(error.message || "An error occurred while creating the client");
      toast.error("An error occurred while creating the client", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
            {error}
          </div>
        )}
        
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
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
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
      </DialogContent>
    </Dialog>
  );
}
