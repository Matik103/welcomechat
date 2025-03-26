import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { ValidationResult } from "./ValidationResult";
import { ScrapabilityInfo } from "./ScrapabilityInfo";
import { useUrlAccessCheck, UrlCheckResult } from "@/hooks/useUrlAccessCheck";

const websiteUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL including http:// or https://"),
});

type WebsiteUrlFormValues = z.infer<typeof websiteUrlSchema>;

interface WebsiteUrlFormProps {
  clientId: string;
  onAddSuccess?: () => void;
  webstoreHook: any;
}

export const WebsiteUrlForm = ({ clientId, onAddSuccess, webstoreHook }: WebsiteUrlFormProps) => {
  const [adding, setAdding] = useState(false);
  const [configStatus, setConfigStatus] = useState<{isConfigured: boolean; message: string} | null>(null);
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [isContentStored, setIsContentStored] = useState(false);
  
  const { addWebsite, storeWebsiteContent, isStoring } = webstoreHook;
  const { checkUrlAccess, isChecking, lastResult } = useUrlAccessCheck();

  const form = useForm<WebsiteUrlFormValues>({
    resolver: zodResolver(websiteUrlSchema),
    defaultValues: {
      url: "",
    },
  });

  const watchUrl = form.watch("url");

  useEffect(() => {
    const checkConfig = async () => {
      setIsCheckingConfig(true);
      try {
        const result = await FirecrawlService.verifyFirecrawlConfig();
        setConfigStatus({
          isConfigured: result.success,
          message: result.error || result.data?.message || 'Configuration status unknown'
        });
      } catch (error) {
        console.error("Error checking Firecrawl config:", error);
        setConfigStatus({
          isConfigured: false,
          message: error instanceof Error ? error.message : 'Unknown error checking configuration'
        });
      } finally {
        setIsCheckingConfig(false);
      }
    };
    
    checkConfig();
  }, []);

  useEffect(() => {
    setProcessingJobId(null);
    setIsContentStored(false);
    
    if (watchUrl && websiteUrlSchema.shape.url.safeParse(watchUrl).success) {
      const validateUrl = async () => {
        try {
          await checkUrlAccess(watchUrl);
        } catch (error) {
          console.error("Error validating URL:", error);
        }
      };
      
      const timeoutId = setTimeout(validateUrl, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [watchUrl, checkUrlAccess]);

  const onSubmit = async (values: WebsiteUrlFormValues) => {
    if (!clientId) {
      toast.error("Client ID is missing");
      return;
    }
    
    if (!configStatus?.isConfigured) {
      toast.error("Firecrawl API is not configured. Please contact your administrator.");
      return;
    }

    const validation = FirecrawlService.validateUrl(values.url);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid URL");
      return;
    }

    setAdding(true);
    try {
      const result = await addWebsite({
        client_id: clientId,
        url: values.url,
        scrapable: true,
        refresh_rate: 30,
      });
      
      if (result && result.length > 0) {
        const website = result[0];
        toast.success("Website added to database");
        
        const documentId = `web-${Date.now()}`;
        const processResult = await FirecrawlService.processDocument(
          website.url,
          "website",
          clientId,
          "AI Assistant",
          documentId,
          {
            limit: 50,
            maxDepth: 3,
            scrapeOptions: {
              formats: ["markdown"],
              onlyMainContent: true
            }
          }
        );
        
        if (processResult.success) {
          toast.success("Website processing initiated");
          
          if (processResult.data?.jobId) {
            setProcessingJobId(processResult.data.jobId);
          }
          
          const storeResult = await storeWebsiteContent(website);
          
          if (storeResult && storeResult.success) {
            setIsContentStored(true);
            toast.success("Website content stored successfully");
            
            form.reset();
            if (onAddSuccess) onAddSuccess();
          } else if (storeResult && storeResult.error) {
            console.error("Failed to store website content:", storeResult.error);
            toast.error(`Failed to store website content: ${storeResult.error}`);
          }
        } else {
          console.error("Failed to process website:", processResult.error);
          toast.error(`Website added but processing failed: ${processResult.error}`);
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
    <div className="space-y-6">
      {configStatus && !configStatus.isConfigured && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          <h3 className="text-red-800 font-medium">Firecrawl API Not Configured</h3>
          <p className="mt-1">{configStatus.message}</p>
          <p className="mt-2 text-sm">Please contact your administrator to set up the Firecrawl API key.</p>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    disabled={adding || isStoring || isChecking || isCheckingConfig}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {isChecking && (
            <div className="flex items-center text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Validating URL...</span>
            </div>
          )}
          
          {lastResult && !isChecking && (
            <>
              <ValidationResult 
                error={lastResult.error || null}
                isValidated={!!lastResult}
                lastResult={lastResult as UrlCheckResult}
              />
              
              {lastResult.isAccessible && (
                <ScrapabilityInfo 
                  lastResult={lastResult as UrlCheckResult}
                  isValidated={true}
                  isContentStored={isContentStored}
                />
              )}
            </>
          )}
          
          <Button 
            type="submit" 
            disabled={
              adding || 
              isStoring || 
              isChecking || 
              isCheckingConfig || 
              !configStatus?.isConfigured || 
              !lastResult?.isAccessible
            } 
            className="w-full"
          >
            {(adding || isStoring) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {adding ? "Adding..." : "Processing..."}
              </>
            ) : (
              "Add Website"
            )}
          </Button>
        </form>
      </Form>
      
      {processingJobId && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
          <h3 className="text-blue-800 font-medium">Processing Job Started</h3>
          <p className="text-blue-600 text-sm mt-1">
            Job ID: {processingJobId}
          </p>
          <p className="text-blue-700 text-sm mt-2">
            Your website is being processed in the background. This may take a few minutes depending on the size of the website.
          </p>
        </div>
      )}
    </div>
  );
};
