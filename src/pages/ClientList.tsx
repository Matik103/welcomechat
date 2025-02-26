
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DeleteClientDialog } from "@/components/client/DeleteClientDialog";
import { ClientHeader } from "@/components/client/ClientHeader";
import { ClientSearchBar } from "@/components/client/ClientSearchBar";
import { ClientListTable } from "@/components/client/ClientListTable";

const ITEMS_PER_PAGE = 10;

type Client = {
  id: string;
  client_name: string;
  agent_name: string;
  status: string;
  updated_at: string;
  email: string;
};

const ClientList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("client_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    client?: Client;
  }>({ isOpen: false });

  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["clients", sortField, sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .is('deletion_scheduled_at', null)
        .order(sortField, { ascending: sortOrder === "asc" });
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredClients = clients.filter(client =>
    client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.agent_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleDeleteClick = (client: Client) => {
    setDeleteDialog({ isOpen: true, client });
  };

  const handleDeleteComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <ClientHeader />

        <div className="flex items-center justify-between gap-4 mb-6">
          <ClientSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSort={handleSort}
          />
          <Link
            to="/admin/clients/new"
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Client
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <ClientListTable
            clients={paginatedClients}
            onDeleteClick={handleDeleteClick}
          />

          {filteredClients.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              No clients found. Add your first client to get started.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {deleteDialog.client && (
        <DeleteClientDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false })}
          clientName={deleteDialog.client.client_name}
          clientId={deleteDialog.client.id}
          clientEmail={deleteDialog.client.email}
          onDeleted={handleDeleteComplete}
        />
      )}
    </div>
  );
};

export default ClientList;
