
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Plus, Bot as BotIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { DeleteClientDialog } from "@/components/client/DeleteClientDialog";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { checkAndRefreshAuth } from "@/services/authService";
import { createClientActivity } from "@/services/clientActivityService";
import { ClientActions } from "@/components/client/ClientActions";
import { execSql } from "@/utils/rpcUtils";

const ClientList = () => {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        await checkAndRefreshAuth();
        
        // More detailed query to get accurate client information
        // Only fetching config records which represent the primary client data
        const query = `
          SELECT 
            id, 
            client_id,
            client_name,
            name,
            email,
            agent_description,
            logo_url,
            logo_storage_path,
            created_at,
            updated_at,
            settings,
            status,
            last_active
          FROM ai_agents
          WHERE interaction_type = 'config'
          ORDER BY created_at DESC
          LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
        `;
        
        const countQuery = `
          SELECT COUNT(*) 
          FROM ai_agents
          WHERE interaction_type = 'config'
        `;
        
        const data = await execSql(query);
        const countResult = await execSql(countQuery);
        
        if (!data || !Array.isArray(data)) {
          console.error("Error with client data format:", data);
          toast({
            title: "Error",
            description: "Failed to fetch clients. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Get the total count
        const count = countResult?.[0]?.count ? parseInt(countResult[0].count) : 0;
        
        // Convert the AI agents data to Client type
        const clientData: Client[] = data.map(agent => ({
          id: agent.id,
          client_id: agent.client_id || agent.id,
          client_name: agent.client_name || "",
          email: agent.email || "",
          logo_url: agent.logo_url || "",
          logo_storage_path: agent.logo_storage_path || "",
          created_at: agent.created_at,
          updated_at: agent.updated_at,
          last_active: agent.last_active,
          deletion_scheduled_at: agent.deletion_scheduled_at,
          deleted_at: agent.deleted_at,
          status: agent.status || "active",
          company: (agent.settings && typeof agent.settings === 'object' && agent.settings.company) || "",
          description: agent.agent_description || "",
          name: agent.name || "AI Assistant",
          agent_name: agent.name || "AI Assistant",
          widget_settings: {
            agent_name: agent.name || "AI Assistant",
            agent_description: agent.agent_description || "",
            logo_url: agent.logo_url || "",
            logo_storage_path: agent.logo_storage_path || "",
            ...(agent.settings || {})
          }
        }));

        setClients(clientData);
        setTotalPages(Math.ceil(count / PAGE_SIZE));
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Error",
          description: "Failed to fetch clients. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [page, toast]);

  const renderAgentName = (client: Client) => {
    const agentName = client.name || client.agent_name || "AI Assistant";
    return (
      <span className="inline-flex items-center gap-1">
        <BotIcon className="w-4 h-4 text-primary" />
        {agentName}
      </span>
    );
  };

  const filteredClients = clients.filter((client) => {
    const searchTerm = search.toLowerCase();
    return (
      client.client_name.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm) ||
      (client.name || "AI Assistant").toLowerCase().includes(searchTerm)
    );
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "deleted":
        return "destructive";
      default:
        return "outline";
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
    
    createClientActivity(
      client.id,
      "client_updated",
      `Admin opened deletion dialog for ${client.client_name}`,
      { 
        action: "delete_dialog_opened",
        client_name: client.client_name,
        admin_action: true
      }
    );
  };

  const handleEditClick = (client: Client) => {
    createClientActivity(
      client.id,
      "client_updated",
      `Admin edited client ${client.client_name}`,
      { 
        action: "edit_initiated",
        client_name: client.client_name,
        admin_action: true
      }
    );
    
    navigate(`/admin/clients/${client.id}`);
  };

  const handleClientCreated = () => {
    createClientActivity(
      "system",
      "system_update",
      "Admin initiated new client creation",
      { 
        action: "client_creation_initiated",
        admin_action: true
      }
    );
    
    navigate("/admin/clients/new");
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Input
          type="search"
          placeholder="Search clients..."
          value={search}
          onChange={handleSearch}
          className="max-w-md"
        />
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="mx-2">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
        <Button onClick={handleClientCreated}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>
      
      <div className="rounded-md border mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>AI Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {loading ? "Loading clients..." : "No clients found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.client_name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{renderAgentName(client)}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(client.status)}>
                      {capitalizeFirstLetter(client.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.last_active
                      ? formatDistanceToNow(new Date(client.last_active), { addSuffix: true })
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(client)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {loading && (
        <div className="text-center mt-4">
          Loading clients...
        </div>
      )}

      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        client={selectedClient}
        onClientsUpdated={() => {
          if (selectedClient) {
            createClientActivity(
              selectedClient.id,
              "client_deleted",
              `Client ${selectedClient.client_name} was scheduled for deletion`,
              { 
                client_name: selectedClient.client_name,
                client_email: selectedClient.email,
                admin_action: true,
                deletion_scheduled: true
              }
            );
          }
          
          setClients((prevClients) =>
            prevClients.filter((c) => c.id !== selectedClient?.id)
          );
          setSelectedClient(null);
        }}
      />
    </div>
  );
};

export default ClientList;
