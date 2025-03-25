
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import { processExistingDocuments } from "@/utils/documentReprocessing";

export function ProcessExistingDocuments() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessDocuments = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Process all pending documents
      const result = await processExistingDocuments();
      setResults(result);
      
      if (!result.success) {
        setError("Failed to process documents. Check console for details.");
      }
    } catch (err) {
      console.error("Error processing documents:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Existing Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Document Processing</AlertTitle>
          <AlertDescription>
            This will attempt to process all documents with status "pending" or "needs_processing".
            The process may take several minutes depending on the number of documents.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleProcessDocuments}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Process All Pending Documents"
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && results.success && (
          <div className="pt-4 space-y-4">
            <Alert variant={results.processed.length > 0 ? "default" : "warning"}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Processing Complete</AlertTitle>
              <AlertDescription>
                Processed {results.processed.length} documents successfully.
                {results.failed.length > 0 && ` Failed to process ${results.failed.length} documents.`}
              </AlertDescription>
            </Alert>

            {results.processed.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Successfully Processed:</h4>
                <ul className="space-y-1 text-sm">
                  {results.processed.map((doc: any) => (
                    <li key={doc.id} className="text-green-600">
                      Document ID: {doc.id}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.failed.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Failed to Process:</h4>
                <ul className="space-y-1 text-sm">
                  {results.failed.map((doc: any) => (
                    <li key={doc.id} className="text-red-600">
                      Document ID: {doc.id} - {doc.error || "Unknown error"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
