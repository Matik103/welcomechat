import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAiAgentManagement } from "@/hooks/useAiAgentManagement";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateTempPassword } from "@/utils/passwordUtils";
import { sendWelcomeEmail } from "@/utils/email/welcomeEmail";
import { saveClientTempPassword } from "@/utils/passwordUtils";

// Schema with optional chatbot fields
import { z } from "zod";
const createClientSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  agent_name: z.string().optional(),
  agent_description: z.string().optional()
});

type CreateClientFormValues = z.infer<typeof createClientSchema>;

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateClientModal({ isOpen, onClose }: CreateClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ensureAiAgentExists } = useAiAgentManagement();
  const navigate = useNavigate();

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      client_name: "",
      email: "",
      agent_name: "",
      agent_description: ""
    }
  });

  const handleSubmit = async (data: CreateClientFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Generate a client ID (would normally come from the backend)
      const tempClientId = crypto.randomUUID();
      
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      console.log("Generated temporary password:", tempPassword.substring(0, 3) + "...");
      
      // Create AI agent (which also creates the client) but disable activity logging
      const result = await ensureAiAgentExists(
        tempClientId,
        data.agent_name || "Default Agent", // Provide a default if empty
        data.agent_description,
        "", // logoUrl
        "", // logoStoragePath
        data.client_name,
        true // skipActivityLog - ensure we skip activity logging
      );
      
      if (result.success) {
        // Store the temporary password - using agent.id instead of agentId
        const agentId = result.agent?.id || tempClientId;
        
        try {
          const passwordResult = await saveClientTempPassword(
            agentId, 
            data.email,
            tempPassword
          );
          
          // Send welcome email with credentials
          const emailResult = await sendWelcomeEmail(
            data.email,
            data.client_name,
            passwordResult.password || tempPassword // Use password from result if available
          );
          
          if (emailResult.emailSent) {
            toast.success("Client created and welcome email sent successfully!");
          } else {
            toast.warning(`Client created but failed to send welcome email: ${emailResult.emailError}`);
            console.error("Failed to send welcome email:", emailResult.emailError);
          }
        } catch (error) {
          console.error("Error saving temporary password:", error);
          toast.warning("Client created but failed to set up login credentials.");
        }
        
        navigate(`/admin/clients`);
        onClose();
      } else {
        console.error("Failed to create client:", result.error);
        toast.error("Failed to create client");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("An error occurred while creating the client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Create New Client</span>
          </DialogTitle>
        </DialogHeader>
        
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
                  <FormLabel>Chatbot Name (Optional)</FormLabel>
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
                  <FormLabel>Chatbot Description (Optional)</FormLabel>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
