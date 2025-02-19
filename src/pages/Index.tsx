
import { useState } from "react";
import { ArrowRight, Plus, Users } from "lucide-react";

const dummyRecentActivity = [
  {
    clientName: "TechCorp Inc",
    action: "added Google Drive link",
    date: "2024-02-20",
  },
  {
    clientName: "Innovation Labs",
    action: "updated widget settings",
    date: "2024-02-19",
  },
  {
    clientName: "Digital Solutions",
    action: "created",
    date: "2024-02-18",
  },
  {
    clientName: "Future Systems",
    action: "added URL",
    date: "2024-02-17",
  },
  {
    clientName: "Smart Services",
    action: "updated AI Agent Name",
    date: "2024-02-16",
  },
];

const MetricCard = ({ title, value, change }: { title: string; value: string | number; change?: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-fade-in">
    <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
    <div className="flex items-end gap-2">
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      {change && (
        <span className="text-secondary text-sm font-medium mb-1">
          +{change}
        </span>
      )}
    </div>
  </div>
);

const ActivityItem = ({ item }: { item: typeof dummyRecentActivity[0] }) => (
  <div className="flex items-center gap-4 py-3 animate-slide-in">
    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
      <Users className="w-4 h-4 text-primary" />
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-900">
        <span className="font-medium">{item.clientName}</span>{" "}
        {item.action}
      </p>
      <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
    </div>
  </div>
);

const ActionButton = ({ children, primary = false, onClick }: { children: React.ReactNode; primary?: boolean; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`${
      primary
        ? "bg-primary text-white hover:bg-primary/90"
        : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
    } px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200`}
  >
    {children}
  </button>
);

const Index = () => {
  const [timeRange, setTimeRange] = useState<"1d" | "1m" | "1y" | "all">("all");

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">AI Chatbot Admin System</h1>
          <p className="text-gray-500">Monitor and manage your AI chatbot clients</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Clients" value="128" change="25%" />
          <MetricCard title="Active Clients" value="85" change="12%" />
          <MetricCard title="Avg. Interactions" value="42" />
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-fade-in">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Interactions</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-bold text-gray-900">2,420</span>
              <span className="text-secondary text-sm font-medium">+28%</span>
            </div>
            <div className="flex gap-2">
              {(["1d", "1m", "1y", "all"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2 py-1 text-xs rounded-md ${
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
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="divide-y divide-gray-100">
            {dummyRecentActivity.map((activity, index) => (
              <ActivityItem key={index} item={activity} />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <ActionButton primary onClick={() => console.log("Add new client")}>
            <Plus className="w-4 h-4" /> Add New Client
          </ActionButton>
          <ActionButton onClick={() => console.log("View client list")}>
            View Client List <ArrowRight className="w-4 h-4" />
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default Index;
