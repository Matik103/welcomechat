
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { updateAllAgentNames, getMismatchedAgentNameCount } from "@/services/agentService";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function AgentNameFixer() {
  const [mismatchCount, setMismatchCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [result, setResult] = useState<{
    updated_count: number;
    client_count: number;
    error_count: number;
  } | null>(null);

  // Check for mismatched agent names on component mount
  useEffect(() => {
    checkMismatchedNames();
  }, []);

  const checkMismatchedNames = async () => {
    try {
      setIsChecking(true);
      const count = await getMismatchedAgentNameCount();
      setMismatchCount(count);
    } catch (error) {
      console.error("Error checking mismatched names:", error);
      toast.error("Failed to check mismatched agent names");
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdateNames = async () => {
    try {
      setIsLoading(true);
      const updateResult = await updateAllAgentNames();
      setResult(updateResult);
      setMismatchCount(0); // Assume all fixed
      toast.success(`Updated ${updateResult.updated_count} AI agent records`);
    } catch (error) {
      console.error("Failed to update agent names:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isChecking ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking AI agent names...
        </div>
      ) : mismatchCount !== null ? (
        <div className="flex items-center gap-2 text-sm">
          {mismatchCount > 0 ? (
            <>
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-amber-700">{mismatchCount} AI agent records have mismatched names</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-700">All AI agent records have the correct names</span>
            </>
          )}
        </div>
      ) : null}

      {result && (
        <div className="text-sm space-y-1 p-3 bg-slate-50 rounded-md">
          <p>Results:</p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>Updated {result.updated_count} AI agent records</li>
            <li>Processed {result.client_count} clients</li>
            {result.error_count > 0 && (
              <li className="text-red-500">Encountered {result.error_count} errors</li>
            )}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkMismatchedNames} 
          disabled={isChecking}
        >
          {isChecking && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Check Again
        </Button>
        
        <Button 
          size="sm" 
          onClick={handleUpdateNames} 
          disabled={isLoading || (mismatchCount !== null && mismatchCount === 0)}
        >
          {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Update Agent Names
        </Button>
      </div>
    </div>
  );
}
