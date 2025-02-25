
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const ClientDashboard = () => {
  const [timeRange, setTimeRange] = useState<"1d" | "1m" | "1y" | "all">("all");

  const { data: clientStats } = useQuery({
    queryKey: ["client-stats", timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case "1d":
          startDate.setDate(now.getDate() - 1);
          break;
        case "1m":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "1y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0);
      }

      // Get chat interactions
      const { data: interactions } = await supabase
        .from("client_activities")
        .select("*")
        .eq('activity_type', 'chat_interaction')
        .gte("created_at", startDate.toISOString());

      return {
        totalInteractions: interactions?.length ?? 0,
        recentChats: interactions?.slice(0, 5) ?? [],
      };
    },
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
            <p className="text-gray-500">Monitor your AI chatbot performance</p>
          </div>
          <div className="flex gap-2">
            {(["1d", "1m", "1y", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === range
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } transition-colors duration-200`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Interactions</CardTitle>
              <CardDescription>Chat interactions in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{clientStats?.totalInteractions}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Chats</CardTitle>
            <CardDescription>Latest interactions with your AI chatbot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientStats?.recentChats.map((chat: any) => (
                <div key={chat.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{chat.description}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(chat.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
