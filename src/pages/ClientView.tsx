
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

  const { data: activities } = useQuery({
    queryKey: ["client-activities", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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
                <p className="font-medium">
                  {client.last_active 
                    ? format(new Date(client.last_active), 'PPP')
                    : 'No interactions yet'}
                </p>
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
              {activities?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Chat Type</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          {format(new Date(activity.created_at!), 'PP')}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{activity.activity_type}</span>
                        </TableCell>
                        <TableCell>{activity.description}</TableCell>
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
