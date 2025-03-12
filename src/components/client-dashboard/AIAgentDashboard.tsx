import { useAIAgentStats } from '@/hooks/useAIAgentStats';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  loading?: boolean;
}

function StatCard({ title, value, description, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {loading ? (
        <div className="mt-2 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="mt-2 text-3xl font-semibold text-blue-600">{value}</div>
          {description && (
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          )}
        </>
      )}
    </div>
  );
}

interface LogEntryProps {
  message: string;
  timestamp: string;
  type?: 'error' | 'log';
}

function LogEntry({ message, timestamp, type = 'log' }: LogEntryProps) {
  return (
    <div className="border-b border-gray-200 py-3">
      <div className={`text-sm ${type === 'error' ? 'text-red-600' : 'text-gray-900'}`}>
        {message}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {new Date(timestamp).toLocaleString()}
      </div>
    </div>
  );
}

interface TopicBadgeProps {
  topic: string;
  count: number;
}

function TopicBadge({ topic, count }: TopicBadgeProps) {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
      {topic}
      <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-200">
        {count}
      </span>
    </div>
  );
}

interface AIAgentDashboardProps {
  agentId: string;
}

export default function AIAgentDashboard({ agentId }: AIAgentDashboardProps) {
  const { stats, loading, error, refreshStats } = useAIAgentStats(agentId);

  if (error) {
    toast.error('Failed to load AI agent statistics');
    return (
      <div className="text-center py-4 text-red-600">
        Error loading statistics. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Interactions"
          value={stats?.totalInteractions || 0}
          loading={loading}
        />
        <StatCard
          title="Active Days"
          value={stats?.activeDays || 0}
          loading={loading}
        />
        <StatCard
          title="Avg Response Time"
          value={`${((stats?.avgResponseTime || 0) / 1000).toFixed(2)}s`}
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Common Topics</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <div>
            {stats?.commonTopics.map((topic) => (
              <TopicBadge
                key={topic.topic}
                topic={topic.topic}
                count={topic.count}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Error Logs</h3>
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.recentErrors.map((error, index) => (
                <LogEntry
                  key={index}
                  message={error.message}
                  timestamp={error.timestamp}
                  type="error"
                />
              ))}
              {stats?.recentErrors.length === 0 && (
                <p className="text-sm text-gray-500">No recent errors</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Logs</h3>
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.recentLogs.map((log, index) => (
                <LogEntry
                  key={index}
                  message={log.message}
                  timestamp={log.timestamp}
                />
              ))}
              {stats?.recentLogs.length === 0 && (
                <p className="text-sm text-gray-500">No recent logs</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 