
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { DriveLinks } from "@/components/client/DriveLinks";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface DriveLinksSectionProps {
  clientId: string | undefined;
  driveLinks: any[];
  addDriveLinkMutation: any;
  deleteDriveLinkMutation: any;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

const DriveLinksSection = ({ 
  clientId, 
  driveLinks = [], 
  addDriveLinkMutation, 
  deleteDriveLinkMutation,
  logClientActivity 
}: DriveLinksSectionProps) => {
  
  // Handle adding a drive link
  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    if (!clientId) {
      toast.error("Cannot add drive link: Client ID not found");
      return;
    }

    try {
      // Make sure to include the client_id in the data
      const dataWithClientId = {
        ...data,
        client_id: clientId
      };
      
      await addDriveLinkMutation.mutateAsync(dataWithClientId);
      
      await logClientActivity(
        "drive_link_added", 
        "added a Google Drive link", 
        { link: data.link }
      );
      
      toast.success("Google Drive link added successfully");
    } catch (error) {
      console.error("Error adding drive link:", error);
      toast.error("Failed to add Google Drive link");
      throw error; // Re-throw to be caught by the DriveLinks component
    }
  };

  // Handle deleting a drive link
  const handleDeleteDriveLink = async (id: number) => {
    try {
      const linkToDelete = driveLinks.find(link => link.id === id);
      await deleteDriveLinkMutation.mutateAsync(id);
      
      if (linkToDelete) {
        await logClientActivity(
          "drive_link_deleted", 
          "removed a Google Drive link", 
          { link: linkToDelete.link }
        );
      }
      
      toast.success("Google Drive link removed successfully");
    } catch (error) {
      console.error("Error deleting drive link:", error);
      toast.error("Failed to remove Google Drive link");
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Database className="h-5 w-5 text-muted-foreground" />
        <CardTitle>Google Drive Links</CardTitle>
      </CardHeader>
      <CardContent>
        <DriveLinks
          driveLinks={driveLinks}
          onAdd={handleAddDriveLink}
          onDelete={handleDeleteDriveLink}
          isAddLoading={addDriveLinkMutation.isPending}
          isDeleteLoading={deleteDriveLinkMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default DriveLinksSection;
