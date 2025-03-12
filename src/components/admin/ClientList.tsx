import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import ClientActions from './ClientActions';
import type { Client } from '@/types/supabase';
import { ErrorBoundary } from '../ErrorBoundary';

const PAGE_SIZE = 10;

type SortField = 'name' | 'email' | 'agent_name' | 'updated_at';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

export default function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<SortState>({ field: 'updated_at', direction: 'desc' });

  const fetchClients = async () => {
    try {
      setLoading(true);

      // Get total count for pagination
      const countQuery = supabase
        .from('clients')
        .select('id', { count: 'exact' })
        .ilike('name', `%${searchQuery}%`);

      // Get paginated and sorted data
      let query = supabase
        .from('clients')
        .select(`
          *,
          ai_agents (
            id,
            agent_name
          )
        `)
        .ilike('name', `%${searchQuery}%`)
        .order(sort.field === 'agent_name' ? 'ai_agents(agent_name)' : sort.field, {
          ascending: sort.direction === 'asc',
        })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

      const [countResult, dataResult] = await Promise.all([countQuery, query]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      setTotalCount(countResult.count || 0);
      setClients(dataResult.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery, currentPage, sort]);

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return null;
    return sort.direction === 'asc' ? (
      <FiChevronUp className="inline-block ml-1" />
    ) : (
      <FiChevronDown className="inline-block ml-1" />
    );
  };

  const SkeletonRow = () => (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </td>
    </tr>
  );

  const EmptyState = () => (
    <tr>
      <td colSpan={5} className="px-6 py-12 text-center">
        <div className="text-gray-500">
          <p className="text-lg font-medium">No clients found</p>
          <p className="mt-1 text-sm">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by adding your first client'}
          </p>
        </div>
      </td>
    </tr>
  );

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={() => navigate('/admin/clients/new')}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add New Client
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: 'name' as const, label: 'Client Name' },
                  { key: 'email' as const, label: 'Email' },
                  { key: 'agent_name' as const, label: 'AI Agent Name' },
                  { key: 'updated_at' as const, label: 'Last Updated' },
                ].map((column) => (
                  <th
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  >
                    {column.label}
                    <SortIcon field={column.key} />
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : clients.length === 0 ? (
                <EmptyState />
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {client.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {client.ai_agents?.[0]?.agent_name || 'No Agent'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(client.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ClientActions client={client} onClientDeleted={fetchClients} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > PAGE_SIZE && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} results
            </div>
            <div className="space-x-2">
              {Array.from(
                { length: Math.ceil(totalCount / PAGE_SIZE) },
                (_, i) => i + 1
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 