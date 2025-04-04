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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Agent } from "@/types/agent";
import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentDetailsTab } from "./configure-tabs/AgentDetailsTab";
import { DocumentsTab } from "./configure-tabs/DocumentsTab";
import { WebsiteUrlsTab } from "./configure-tabs/WebsiteUrlsTab";
import { GoogleDriveTab } from "./configure-tabs/GoogleDriveTab";

interface AgentConfigureDialogProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAgent: (agent: Agent) => void;
}

const ConfigureTabs = ({ agent, onClose }: { agent: Agent; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<string>("details");

  const handleSuccess = useCallback(() => {
    // Refresh the agent data
    // You might want to refetch the agent data here to ensure it's up-to-date
    // For example:
    // refetchAgentData(); // Assuming you have a function to refetch agent data
  }, [/* dependencies */]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="websites">Websites</TabsTrigger>
        <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <AgentDetailsTab agent={agent} onSuccess={handleSuccess} />
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <DocumentsTab 
          clientId={agent.client_id} 
          onSuccess={handleSuccess}
        />
      </TabsContent>

      <TabsContent value="websites" className="space-y-4">
        <WebsiteUrlsTab clientId={agent.client_id} onSuccess={handleSuccess} />
      </TabsContent>

      <TabsContent value="google-drive" className="space-y-4">
        <GoogleDriveTab clientId={agent.client_id} onSuccess={handleSuccess} />
      </TabsContent>
    </Tabs>
  );
};

export function AgentConfigureDialog({
  agent,
  open,
  onOpenChange,
  onUpdateAgent,
}: AgentConfigureDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Simulate an update process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // After successful update
      toast({
        title: "Agent updated.",
        description: "Your agent has been successfully updated.",
      });

      // Close the dialog
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      });
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
