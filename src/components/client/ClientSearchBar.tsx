
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSort: (field: string) => void;
}

export const ClientSearchBar = ({
  searchQuery,
  onSearchChange,
  onSort,
}: ClientSearchBarProps) => {
  return (
    <div className="flex items-center gap-4 flex-1">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            Sort by <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onSort("client_name")}>
            Client Name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort("agent_name")}>
            AI Agent Name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort("status")}>
            Status
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort("updated_at")}>
            Last Updated
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
