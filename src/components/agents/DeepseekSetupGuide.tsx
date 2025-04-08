
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

  const handleSetupAssistant = async () => {
    setIsSettingUp(true);
    try {
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
      toast.error(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    <Alert className="border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle>DeepSeek Assistant Setup Required</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          You need to set up a DeepSeek assistant before you can use the chat preview.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSetupAssistant}
          disabled={isSettingUp}
        >
          {isSettingUp ? "Setting up..." : "Set up DeepSeek Assistant"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
