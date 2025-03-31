
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabaseAdmin } from "@/integrations/supabase/admin";
import { generateTempPassword, saveClientTempPassword } from "@/utils/passwordUtils";
import { sendWelcomeEmail } from "@/utils/email/welcomeEmail";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Form validation schema
const clientFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  agentName: z.string().default("AI Assistant").optional(),
  agentDescription: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewClientModal({ isOpen, onClose }: NewClientModalProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      clientName: "",
      email: "",
      agentName: "AI Assistant",
      agentDescription: "",
    },
  });

  const handleSubmit = async (values: ClientFormValues) => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Generate a UUID for client_id
      const clientId = crypto.randomUUID();
      const tempPassword = generateTempPassword();
      
      const insertData = {
        client_id: clientId, // Explicitly set client_id
        client_name: values.clientName,
        email: values.email,
        name: values.agentName || "AI Assistant",
        agent_description: values.agentDescription || "",
        interaction_type: "config", 
        settings: {
          agent_name: values.agentName || "AI Assistant",
          agent_description: values.agentDescription || "",
          client_name: values.clientName,
          email: values.email
        },
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        type: "client_created"
      };
      
      const { data, error } = await supabaseAdmin
        .from("ai_agents")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Error creating client:", error);
        throw error;
      }
      
      const agentId = data?.id;
      
      if (agentId) {
        await saveClientTempPassword(agentId, values.email, tempPassword);
        
        const emailResult = await sendWelcomeEmail(
          values.email,
          values.clientName,
          tempPassword
        );
        
        if (emailResult.emailSent) {
          toast.success("Client created and welcome email sent successfully!");
        } else {
          toast.warning(`Client created but failed to send welcome email: ${emailResult.emailError}`);
          console.error("Failed to send welcome email:", emailResult.emailError);
        }
      }
      
      toast.success("Client created successfully!");
      onClose();
      navigate("/admin/clients");
    } catch (err: any) {
      console.error("Error creating client:", err);
      setError(err.message || "Failed to create client");
      toast.error(err.message || "Failed to create client");
    } finally {
      setIsCreating(false);
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
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientName"
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
              name="agentName"
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
              name="agentDescription"
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
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
