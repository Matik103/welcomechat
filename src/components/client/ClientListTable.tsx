
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
          <TableHead>Status</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.client_name}</TableCell>
            <TableCell>{client.agent_name}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  client.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {client.status || 'active'}
              </span>
            </TableCell>
            <TableCell>
              {client.updated_at 
                ? format(new Date(client.updated_at), 'MMM d, yyyy')
                : 'N/A'
              }
            </TableCell>
            <TableCell>
              <ClientActions 
                clientId={client.id} 
                onDeleteClick={() => onDeleteClick(client)} 
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
