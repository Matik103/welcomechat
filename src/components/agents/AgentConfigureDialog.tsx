
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState, useCallback } from "react";
import { AgentDetailsTab } from "./configure-tabs/AgentDetailsTab";
import { DocumentsTab } from "./configure-tabs/DocumentsTab";
import { WebsiteUrlsTab } from "./configure-tabs/WebsiteUrlsTab";
import { GoogleDriveTab } from "./configure-tabs/GoogleDriveTab";
import { toast } from "sonner"; 
import { Agent } from "@/types/agent";

interface AgentConfigureDialogProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAgent: (agent: Agent) => void;
  onDelete?: () => void;
}

const ConfigureTabs = ({ agent, onClose }: { agent: Agent; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<string>("details");
  
  // Create a unified success handler for all tabs
  const handleSuccess = useCallback(() => {
    // This function could be used to refetch agent data or perform other actions
    console.log("Agent configuration updated successfully");
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="websites">Websites</TabsTrigger>
        <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <AgentDetailsTab 
          agent={agent} 
          // Either pass handleSuccess directly or adapt it based on your component's requirements
        />
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <DocumentsTab 
          clientId={agent.client_id}
        />
      </TabsContent>

      <TabsContent value="websites" className="space-y-4">
        <WebsiteUrlsTab 
          clientId={agent.client_id} 
          agentName={agent.name}
          onSuccess={handleSuccess} 
        />
      </TabsContent>

      <TabsContent value="google-drive" className="space-y-4">
        <GoogleDriveTab 
          clientId={agent.client_id} 
          agentName={agent.name}
          onSuccess={handleSuccess} 
        />
      </TabsContent>
    </Tabs>
  );
};

export function AgentConfigureDialog({
  agent,
  open,
  onOpenChange,
  onUpdateAgent,
  onDelete
}: AgentConfigureDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Simulate an update process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // After successful update
      toast.success("Agent updated successfully.");

      // Update the parent component with the new agent data
      onUpdateAgent(agent);
      
      // Close the dialog
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Update failed: " + (error.message || "Unknown error"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Configure Agent</SheetTitle>
          <SheetDescription>
            Make changes to your agent here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <ConfigureTabs agent={agent} onClose={() => onOpenChange(false)} />
        </div>
        <SheetFooter>
          <Button type="button" onClick={handleUpdate}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const SheetFooter = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-end space-x-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost">Cancel</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard all the changes you made.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {children}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
