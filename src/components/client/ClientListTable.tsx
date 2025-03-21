
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
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientListTableProps {
  clients: Client[];
  onDeleteClick: (client: Client) => void;
}

export const ClientListTable = ({ clients, onDeleteClick }: ClientListTableProps) => {
  const [invitationStatus, setInvitationStatus] = useState<Record<string, boolean>>({});

  // Fetch invitation status for all clients
  useEffect(() => {
    const fetchInvitationStatus = async () => {
      if (clients.length === 0) return;
      
      try {
        const clientIds = clients.map(client => client.id);
        
        // Query the client_temp_passwords table to check which clients have had passwords generated
        const { data, error } = await supabase
          .from("client_temp_passwords")
          .select("agent_id")
          .in("agent_id", clientIds);
          
        if (error) {
          console.error("Error fetching invitation status:", error);
          return;
        }
        
        // Create a map of client IDs to invitation sent status
        const statusMap: Record<string, boolean> = {};
        
        // Mark clients with password entries as having invitations sent
        if (data) {
          data.forEach(entry => {
            statusMap[entry.agent_id] = true;
          });
        }
        
        setInvitationStatus(statusMap);
      } catch (error) {
        console.error("Error checking invitation status:", error);
      }
    };
    
    fetchInvitationStatus();
  }, [clients]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client Name</TableHead>
          <TableHead>AI Agent Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Invitation</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
              No clients found
            </TableCell>
          </TableRow>
        ) : (
          clients.map((client) => {
            // Debug client ID for each row
            console.log(`Rendering row for client ${client.client_name} with ID: ${client.id}`);
            
            // Check if this client has had an invitation sent
            const hasInvitationSent = invitationStatus[client.id] || false;
            
            return (
              <TableRow key={client.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{client.client_name}</TableCell>
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
                <TableCell>
                  <Badge
                    variant={hasInvitationSent ? "default" : "secondary"}
                    className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${hasInvitationSent 
                        ? "bg-green-100 text-green-700" 
                        : "bg-amber-100 text-amber-800"}
                    `}
                  >
                    {hasInvitationSent ? 'Invitation Sent' : 'Pending Invitation'}
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
                    invitationSent={hasInvitationSent}
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
