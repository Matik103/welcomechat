
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

// This function properly types the clients array
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
        const { data, error, count } = await supabase
          .from("clients")
          .select("*", { count: "exact" })
          .neq("status", "deleted") // Filter out clients with "deleted" status
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching clients:", error);
          toast({
            title: "Error",
            description: "Failed to fetch clients. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setClients(data || []);
        setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [page, toast]);

  // Add proper type checking for client.agent_name
  const renderAgentName = (client: Client) => {
    const agentName = client.agent_name || "AI Assistant";
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
      (client.agent_name || "AI Assistant").toLowerCase().includes(searchTerm)
    );
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"; // Changed from "success" to "default"
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
  };

  const handleEditClick = (clientId: string) => {
    navigate(`/admin/clients/${clientId}`);
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
          {/* Pagination controls */}
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
        <Button onClick={() => navigate("/admin/clients/new")}>
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
                  No clients found.
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
                        <DropdownMenuItem onClick={() => handleEditClick(client.id)}>
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
