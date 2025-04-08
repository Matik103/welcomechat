
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createDeepseekAssistant } from "@/utils/deepseekUtils";
import { useState } from "react";
import { toast } from "sonner";

interface DeepseekSetupGuideProps {
  clientId: string;
  agentName: string;
  agentDescription: string;
  onSetupComplete?: (assistantId: string) => void;
}

export function DeepseekSetupGuide({
  clientId,
  agentName,
  agentDescription,
  onSetupComplete
}: DeepseekSetupGuideProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const handleSetupAssistant = async () => {
    setIsSettingUp(true);
    setSetupError(null);
    
    try {
      console.log("Setting up DeepSeek assistant with:", {
        clientId,
        agentName: agentName || 'AI Assistant',
        agentDescription: agentDescription || 'A helpful AI assistant'
      });
      
      const assistantId = await createDeepseekAssistant(
        clientId,
        agentName || 'AI Assistant',
        agentDescription || 'A helpful AI assistant'
      );
      
      setIsComplete(true);
      toast.success("DeepSeek assistant created successfully");
      
      if (onSetupComplete) {
        onSetupComplete(assistantId);
      }
    } catch (error) {
      console.error("Failed to set up DeepSeek assistant:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSetupError(errorMessage);
      toast.error(`Setup failed: ${errorMessage}`);
    } finally {
      setIsSettingUp(false);
    }
  };

  if (isComplete) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>DeepSeek Assistant Ready</AlertTitle>
        <AlertDescription>
          Your DeepSeek assistant has been set up successfully and is ready to use.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={setupError ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}>
      <AlertCircle className={`h-4 w-4 ${setupError ? "text-red-600" : "text-amber-600"}`} />
      <AlertTitle>{setupError ? "DeepSeek Assistant Setup Failed" : "DeepSeek Assistant Setup Required"}</AlertTitle>
      <AlertDescription className="space-y-2">
        {setupError ? (
          <div>
            <p className="text-red-700 mb-2">Error: {setupError}</p>
            <p>
              Please ensure the DeepSeek API key is properly configured in your Supabase environment.
            </p>
          </div>
        ) : (
          <p>
            You need to set up a DeepSeek assistant before you can use the chat preview.
          </p>
        )}
        <Button
          variant={setupError ? "destructive" : "outline"}
          size="sm"
          onClick={handleSetupAssistant}
          disabled={isSettingUp}
        >
          {isSettingUp ? "Setting up..." : setupError ? "Retry Setup" : "Set up DeepSeek Assistant"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
