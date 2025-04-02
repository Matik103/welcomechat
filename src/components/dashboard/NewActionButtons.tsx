
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Settings } from "lucide-react";

export function NewActionButtons() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Button 
        onClick={() => navigate("/admin/clients")}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        Manage Clients
      </Button>
      
      <Button 
        onClick={() => navigate("/admin/settings")}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Platform Settings
      </Button>
    </div>
  );
}
