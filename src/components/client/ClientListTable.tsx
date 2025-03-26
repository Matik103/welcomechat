
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientActions } from "./ClientActions";
import { Client } from "@/types/client";
import { Badge } from "@/components/ui/badge";

interface ClientListTableProps {
  clients: Client[];
  onDeleteClick: (client: Client) => void;
}

export const ClientListTable = ({ clients, onDeleteClick }: ClientListTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client Name</TableHead>
          <TableHead>AI Agent Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
              No clients found
            </TableCell>
          </TableRow>
        ) : (
          clients.map((client) => {
            // Check if client is active (has been active in the last 48 hours)
            const isRecentlyActive = client.last_active && 
              (new Date().getTime() - new Date(client.last_active).getTime()) < (48 * 60 * 60 * 1000);
            
            return (
              <TableRow key={client.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {client.client_name}
                  {isRecentlyActive && (
                    <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500" 
                      title="Active in the last 48 hours"></span>
                  )}
                </TableCell>
                <TableCell>{client.agent_name}</TableCell>
                <TableCell className="max-w-xs truncate" title={client.description || ""}>
                  {client.description ? (
                    <span className="text-sm text-gray-600">{client.description.substring(0, 60)}{client.description.length > 60 ? '...' : ''}</span>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No description</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={client.status === "active" ? "default" : "secondary"}
                    className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${client.status === "active" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-600"}
                    `}
                  >
                    {client.status || 'active'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {client.created_at 
                    ? format(new Date(client.created_at), 'MMM d, yyyy')
                    : 'N/A'
                  }
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {client.updated_at 
                    ? format(new Date(client.updated_at), 'MMM d, yyyy')
                    : 'N/A'
                  }
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {client.last_active 
                    ? format(new Date(client.last_active), 'MMM d, yyyy')
                    : 'Never'
                  }
                </TableCell>
                <TableCell>
                  <ClientActions 
                    clientId={client.id} 
                    onDeleteClick={() => onDeleteClick(client)} 
                  />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
