
import React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useClientView } from "@/hooks/useClientView";
import { ClientInfo } from "@/components/client-view/ClientInfo";
import { CommonQueriesTable } from "@/components/client-view/CommonQueriesTable";
import { ChatHistoryTable } from "@/components/client-view/ChatHistoryTable";
import { ErrorLogsTable } from "@/components/client-view/ErrorLogsTable";

const ClientView = () => {
  const { 
    client, 
    isLoadingClient, 
    chatHistory, 
    commonQueries, 
    errorLogs 
  } = useClientView();

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
          <ClientInfo client={client} chatHistory={chatHistory} />
          <CommonQueriesTable commonQueries={commonQueries} />
          <ChatHistoryTable chatHistory={chatHistory} />
          <ErrorLogsTable errorLogs={errorLogs} />
        </div>
      </div>
    </div>
  );
};

export default ClientView;
