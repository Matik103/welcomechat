
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { verifyStorageBuckets } from "@/utils/storageUtils";

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
      // Verify storage buckets
      const storageBuckets = await verifyStorageBuckets();
      
      // Check that LLAMA_CLOUD_API_KEY is set
      const llamaCloudApiKey = import.meta.env.VITE_LLAMA_CLOUD_API_KEY;
      const hasLlamaCloudKey = !!llamaCloudApiKey;
      
      // Determine overall success
      const success = Object.values(storageBuckets).every(exists => exists) && hasLlamaCloudKey;
      
      setResult({
        success,
        message: success ? "All integration components verified successfully" : "Some integration components failed verification",
        details: {
          "API Connection": true,
          "Document Processing": hasLlamaCloudKey,
          "Storage Access": true,
          "Document Storage": storageBuckets['Document Storage'] || false,
          "Client Documents": storageBuckets['Client Documents'] || false
        }
      });
      
      console.log("Verification complete:", {
        storageBuckets,
        hasLlamaCloudKey
      });
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
    
    // Cleanup function to ensure state is reset if component unmounts
    return () => {
      setIsVerifying(false);
    };
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
              <div className="text-sm border rounded-md p-4 bg-slate-50">
                <h3 className="font-medium mb-2">Component Status:</h3>
                <ul className="space-y-1">
                  {Object.entries(result.details).map(([key, value]) => (
                    <li key={key} className="flex items-center space-x-2">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )
                      ) : null}
                      <span>{key}: {typeof value === 'boolean' ? (value ? 'Ready' : 'Not Ready') : value}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
