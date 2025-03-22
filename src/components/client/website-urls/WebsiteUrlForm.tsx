
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const websiteUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL including http:// or https://"),
});

type WebsiteUrlFormValues = z.infer<typeof websiteUrlSchema>;

export interface WebsiteUrlFormProps {
  clientId?: string;
  onAddSuccess?: () => void;
  onSubmit: (url: string) => Promise<boolean>;
  isClientView?: boolean;
}

export const WebsiteUrlForm = ({ onSubmit, isClientView = false }: WebsiteUrlFormProps) => {
  const [adding, setAdding] = useState(false);

  // Form setup with validation
  const form = useForm<WebsiteUrlFormValues>({
    resolver: zodResolver(websiteUrlSchema),
    defaultValues: {
      url: "",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: WebsiteUrlFormValues) => {
    setAdding(true);
    try {
      const success = await onSubmit(values.url);
      
      if (success) {
        form.reset();
      }
    } catch (err: any) {
      console.error("Error adding website URL:", err);
      toast.error(err.message || "Failed to add website URL");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com" 
                    {...field} 
                    disabled={adding}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={adding} 
            className="w-full"
          >
            {adding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Website"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
