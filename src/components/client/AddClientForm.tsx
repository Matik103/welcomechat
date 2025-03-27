
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabaseAdmin } from "@/integrations/supabase/client-admin";

// Form validation schema
const clientFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  chatbotName: z.string().min(1, "Chatbot name is required"),
  chatbotDescription: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export function AddClientForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      clientName: "",
      email: "",
      chatbotName: "AI Assistant",
      chatbotDescription: "",
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    try {
      // Direct database insert only - no OpenAI assistant creation or activity logging
      const { data, error } = await supabaseAdmin
        .from("ai_agents")
        .insert({
          client_name: values.clientName,
          email: values.email,
          name: values.chatbotName,
          agent_description: values.chatbotDescription || "",
          interaction_type: "config",
          settings: {
            agent_name: values.chatbotName,
            agent_description: values.chatbotDescription || "",
            client_name: values.clientName,
            email: values.email
          },
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error("Error creating client:", error);
        throw error;
      }

      // Console log only - no database activity logging or OpenAI assistant creation
      console.log(`Client created: ${values.clientName}`, {
        clientName: values.clientName,
        agentName: values.chatbotName,
      });
      
      toast.success("Client created successfully!");
      navigate("/admin/clients");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
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
          name="chatbotName"
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
          name="chatbotDescription"
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

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Client"
          )}
        </Button>
      </form>
    </Form>
  );
}
