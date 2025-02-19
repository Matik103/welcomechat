import { useState } from "react";
import { ArrowLeft, Plus, Search, ChevronDown, Eye, Settings, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

type Client = {
  id: string;
  name: string;
  aiAgentName: string;
  status: "active" | "inactive";
  lastUpdated: string;
};

const dummyClients: Client[] = [
  {
    id: "1",
    name: "TechCorp Inc",
    aiAgentName: "TechBot",
    status: "active",
    lastUpdated: "2024-02-20",
  },
  {
    id: "2",
    name: "Innovation Labs",
    aiAgentName: "InnoAI",
    status: "active",
    lastUpdated: "2024-02-19",
  },
  {
    id: "3",
    name: "Digital Solutions",
    aiAgentName: "DigiAssist",
    status: "inactive",
    lastUpdated: "2024-02-18",
  },
  {
    id: "4",
    name: "Future Systems",
    aiAgentName: "FutureBot",
    status: "active",
    lastUpdated: "2024-02-17",
  },
  {
    id: "5",
    name: "Smart Services",
    aiAgentName: "SmartAI",
    status: "inactive",
    lastUpdated: "2024-02-16",
  },
];

const ClientList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "aiAgentName" | "status" | "lastUpdated">("name");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const sortOptions = [
    { value: "name", label: "Client Name" },
    { value: "aiAgentName", label: "AI Agent Name" },
    { value: "status", label: "Status" },
    { value: "lastUpdated", label: "Last Updated" },
  ];

  const filteredClients = dummyClients
    .filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.aiAgentName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const currentClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            to="/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-500">View and manage your clients</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none bg-white pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by: {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">AI Agent Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Updated</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentClients.map((client) => (
                  <tr key={client.id} className="group hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{client.name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{client.aiAgentName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          client.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(client.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/clients/${client.id}/edit`}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            to="/clients/new"
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Client
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClientList;
