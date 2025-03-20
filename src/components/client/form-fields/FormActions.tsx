
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormActionsProps {
  isLoading: boolean;
  isClientView: boolean;
  hasInitialData: boolean;
}

export const FormActions = ({ isLoading, isClientView, hasInitialData }: FormActionsProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 pt-4">
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isClientView 
          ? "Save Changes"
          : hasInitialData 
            ? "Update Client" 
            : "Create Client"}
      </Button>
    </div>
  );
};
