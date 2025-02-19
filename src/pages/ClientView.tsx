
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChatInteraction } from "@/types/agent";

const ClientView = () => {
  const { id } = useParams();

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Query the AI agent's vector table for chat history using RPC
  const { data: chatHistory } = useQuery<ChatInteraction[]>({
    queryKey: ["chat-history", client?.agent_name],
    queryFn: async () => {
      if (!client?.agent_name) return [];
      
      // First get table name
      const tableName = client.agent_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      
      // Use raw query to fetch from dynamic table
      const { data, error } = await supabase
        .rpc('fetch_chat_history', {
          table_name: tableName,
          chat_limit: 10
        });
        
      if (error) {
        console.error("Error fetching chat history:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!client?.agent_name,
  });

  // Query common end-user questions
  const { data: commonQueries } = useQuery({
    queryKey: ["common-queries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("common_queries")
        .select("*")
        .eq("client_id", id)
        .order("frequency", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Query error logs for chatbot issues
  const { data: errorLogs } = useQuery({
    queryKey: ["error-logs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900">Client not found</h1>
          <Link 
            to="/clients"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Return to client list
          </Link>
        </div>
      </div>
    );
  }

  const getLastInteractionTime = () => {
    if (!chatHistory?.length) return 'No interactions yet';
    const lastChat = chatHistory[0];
    return format(new Date(lastChat.metadata.timestamp), 'PPP');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            to="/clients"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.client_name}</h1>
            <p className="text-gray-500">AI Agent Performance Dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Agent Configuration</CardTitle>
              <CardDescription>Settings and basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">AI Agent Name</p>
                <p className="font-medium">{client.agent_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Client Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">AI Agent Status</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    client.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {client.status || "active"}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Chat Interaction</p>
                <p className="font-medium">{getLastInteractionTime()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>End-User Questions</CardTitle>
              <CardDescription>Most frequently asked questions by end-users</CardDescription>
            </CardHeader>
            <CardContent>
              {commonQueries?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>End-User Question</TableHead>
                      <TableHead className="text-right">Times Asked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commonQueries.map((query) => (
                      <TableRow key={query.id}>
                        <TableCell>{query.query_text}</TableCell>
                        <TableCell className="text-right">{query.frequency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-4">No end-user questions recorded yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Chat History</CardTitle>
              <CardDescription>Recent conversations between end-users and the AI chatbot</CardDescription>
            </CardHeader>
            <CardContent>
              {chatHistory?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User Message</TableHead>
                      <TableHead>AI Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chatHistory.map((chat) => (
                      <TableRow key={chat.id}>
                        <TableCell>
                          {format(new Date(chat.metadata.timestamp), 'PP')}
                        </TableCell>
                        <TableCell>{chat.metadata.user_message}</TableCell>
                        <TableCell>{chat.content}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-4">No chat history available yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Chatbot Issues</CardTitle>
              <CardDescription>Errors encountered during end-user conversations</CardDescription>
            </CardHeader>
            <CardContent>
              {errorLogs?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Error Type</TableHead>
                      <TableHead>Error Details</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.created_at!), 'PP')}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{log.error_type}</span>
                        </TableCell>
                        <TableCell>{log.message}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === "resolved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {log.status || "pending"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-4">No chatbot issues reported</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientView;
