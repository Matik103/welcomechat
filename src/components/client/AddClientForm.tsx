
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
import { setupOpenAIAssistant } from "@/utils/clientOpenAIUtils";

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
      // Generate a client ID using crypto.randomUUID
      const clientId = crypto.randomUUID();
      
      // Insert with explicitly set client_id field
      const { data, error } = await supabaseAdmin
        .from("ai_agents")
        .insert({
          client_id: clientId, // Explicitly set the client_id
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

      // After successful client creation, set up OpenAI assistant
      try {
        await setupOpenAIAssistant(
          clientId,
          values.chatbotName,
          values.chatbotDescription || "A helpful assistant for " + values.clientName,
          values.clientName
        );
      } catch (openAiError) {
        console.error("Error setting up OpenAI assistant:", openAiError);
        // Continue despite OpenAI setup error, as the client was created successfully
        toast.warning("Client created, but OpenAI assistant setup failed. You can retry setup later.");
      }
      
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
              <FormLabel>Chatbot Description/System Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this chatbot does and how it should behave"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground mt-1">
                This description will be used as the system prompt for the OpenAI assistant.
              </p>
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
