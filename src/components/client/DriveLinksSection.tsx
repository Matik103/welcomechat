
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { DriveLinks } from "@/components/client/DriveLinks";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

interface DriveLinksSectionProps {
  clientId: string | undefined;
  driveLinks: any[];
  addDriveLinkMutation: any;
  deleteDriveLinkMutation: any;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

const DriveLinksSection = ({ 
  clientId, 
  driveLinks, 
  addDriveLinkMutation, 
  deleteDriveLinkMutation,
  logClientActivity 
}: DriveLinksSectionProps) => {
  
  // Handle adding a drive link
  const handleAddDriveLink = async (data: { link: string; refresh_rate: number }) => {
    if (!clientId) {
      return;
    }

    try {
      await addDriveLinkMutation.mutateAsync(data);
      
      await logClientActivity(
        "drive_link_added", 
        "added a Google Drive link", 
        { link: data.link }
      );
    } catch (error) {
      console.error("Error adding drive link:", error);
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
    } catch (error) {
      console.error("Error deleting drive link:", error);
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
