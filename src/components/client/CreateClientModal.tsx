
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAiAgentManagement } from "@/hooks/useAiAgentManagement";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clientFormSchema, ClientFormData } from "@/types/client-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateClientModal({ isOpen, onClose }: CreateClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ensureAiAgentExists } = useAiAgentManagement();
  const navigate = useNavigate();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_name: "",
      email: "",
      agent_name: "AI Assistant",
      agent_description: ""
    }
  });

  const handleSubmit = async (data: ClientFormData) => {
    try {
      setIsSubmitting(true);
      
      // Generate a client ID (would normally come from the backend)
      const tempClientId = crypto.randomUUID();
      
      // Create AI agent (which also creates the client)
      const result = await ensureAiAgentExists(
        tempClientId,
        data.agent_name,
        data.agent_description,
        "", // logoUrl
        "", // logoStoragePath
        data.client_name
      );
      
      if (result.created) {
        toast.success("Client created successfully!");
        navigate(`/admin/clients`);
        onClose();
      } else {
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
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
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
