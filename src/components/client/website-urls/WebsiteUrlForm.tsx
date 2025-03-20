
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const websiteUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type WebsiteUrlFormValues = z.infer<typeof websiteUrlSchema>;

interface WebsiteUrlFormProps {
  clientId: string;
  onAddSuccess?: () => void;
  webstoreHook: any;
}

export const WebsiteUrlForm = ({ clientId, onAddSuccess, webstoreHook }: WebsiteUrlFormProps) => {
  const [adding, setAdding] = useState(false);
  const { addWebsite, storeWebsiteContent, isStoring } = webstoreHook;

  const form = useForm<WebsiteUrlFormValues>({
    resolver: zodResolver(websiteUrlSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (values: WebsiteUrlFormValues) => {
    if (!clientId) {
      toast.error("Client ID is missing");
      return;
    }

    setAdding(true);
    try {
      const newWebsite = {
        client_id: clientId,
        url: values.url,
        scrapable: true,
        refresh_rate: 30,
      };

      const result = await addWebsite(newWebsite);
      
      if (result && result.length > 0) {
        const website = result[0];
        // Store the website content in AI agents table
        const storeResult = await storeWebsiteContent(website);
        
        if (storeResult && storeResult.success) {
          // Clear the form
          form.reset();
          if (onAddSuccess) onAddSuccess();
        } else if (storeResult && storeResult.error) {
          console.error("Failed to store website content:", storeResult.error);
        }
      }
    } catch (error: any) {
      console.error("Error adding website URL:", error);
      toast.error(`Failed to add website URL: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={adding || isStoring} className="w-full">
          {(adding || isStoring) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {adding ? "Adding..." : "Storing..."}
            </>
          ) : (
            "Add Website"
          )}
        </Button>
      </form>
    </Form>
  );
};
