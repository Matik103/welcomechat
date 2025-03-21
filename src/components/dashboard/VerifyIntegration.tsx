
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LlamaCloudService } from "@/utils/LlamaCloudService";
import { Loader2, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const VerifyIntegration = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details: Record<string, any> | null;
  } | null>(null);

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const response = await LlamaCloudService.verifyAssistantIntegration();
      
      setResult({
        success: response.success,
        message: response.success 
          ? "Integration verified successfully!" 
          : `Verification failed: ${response.error}`,
        details: response.data || null
      });
      
      console.log("Verification result:", response);
    } catch (error) {
      console.error("Error during verification:", error);
      setResult({
        success: false,
        message: `Error during verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: null
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Automatically run verification on component mount
  useEffect(() => {
    runVerification();
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>OpenAI Assistant Integration Status</CardTitle>
        <CardDescription>
          Verify all required components for document processing and OpenAI Assistant integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isVerifying ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Verifying integration components...</span>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <span className={result.success ? "text-green-600" : "text-amber-600"}>
                {result.message}
              </span>
            </div>
            
            {result.details && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details">
                  <AccordionTrigger>
                    <span className="text-sm font-medium">Component Status Details</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm border rounded-md p-4 bg-slate-50 space-y-4">
                      {Object.entries(result.details).map(([key, value]) => {
                        if (key === 'allApiKeys' && Array.isArray(value)) {
                          return (
                            <div key={key} className="space-y-2">
                              <h3 className="font-medium">Available API Keys:</h3>
                              <ul className="space-y-1 pl-2 text-xs">
                                {value.map((keyName: string) => (
                                  <li key={keyName} className="flex items-center space-x-1">
                                    <Info className="h-3 w-3 text-blue-500" />
                                    <span>{keyName}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        
                        if (key === 'missingApiKeys' && Array.isArray(value)) {
                          return (
                            <div key={key} className="space-y-2">
                              <h3 className="font-medium">Missing API Keys:</h3>
                              <ul className="space-y-1 pl-2 text-xs">
                                {value.map((keyName: string) => (
                                  <li key={keyName} className="flex items-center space-x-1">
                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                    <span>{keyName}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        
                        if (key === 'availableApiKeys' && Array.isArray(value)) {
                          return (
                            <div key={key} className="space-y-2">
                              <h3 className="font-medium">Available Required API Keys:</h3>
                              <ul className="space-y-1 pl-2 text-xs">
                                {value.map((keyName: string) => (
                                  <li key={keyName} className="flex items-center space-x-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span>{keyName}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={key} className="space-y-2">
                            <h3 className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</h3>
                            <div className="pl-2">
                              {typeof value === 'boolean' ? (
                                <div className="flex items-center space-x-2">
                                  {value ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span>{value ? 'Ready' : 'Not Ready'}</span>
                                </div>
                              ) : typeof value === 'object' && value !== null ? (
                                <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                <span>{String(value)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            
            <Button onClick={runVerification} disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Run Verification Again"
              )}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
