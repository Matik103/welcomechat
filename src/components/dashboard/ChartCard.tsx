import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, Bar, BarChart, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface ChartCardProps {
  title: string;
  description?: string;
  data: any[];
  className?: string;
  type?: 'line' | 'bar';
  xKey?: string;
  yKey?: string;
  height?: number;
}

export function ChartCard({
  title,
  description,
  data = [],
  className = "",
  type = 'bar',
  xKey = 'query',
  yKey = 'count',
  height = 350,
}: ChartCardProps) {
  // Convert data format if query/count structure
  const formattedData = data.map(item => {
    // If it has query and count properties, convert to name/value
    if (typeof item.query === 'string' && typeof item.count === 'number') {
      return {
        name: item.query,
        value: item.count
      };
    }
    // If already has name/value, keep as is
    if (typeof item.name === 'string' && typeof item.value !== 'undefined') {
      return item;
    }
    // Otherwise try to use the provided keys
    return {
      name: item[xKey] || 'Unknown',
      value: item[yKey] || 0
    };
  });

  // Custom tooltip component that safely handles payload
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded-md shadow">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-blue-600">{`Value: ${payload[0].value}`}</p>
        </div>
      );
    }
  
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  height={60}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" activeDot={{ r: 8 }} />
              </LineChart>
            ) : (
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  height={60}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
