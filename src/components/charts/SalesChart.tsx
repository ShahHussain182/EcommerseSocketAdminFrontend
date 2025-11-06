import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  CartesianGrid,
} from 'recharts';
import type { SalesDataPoint } from '@/types';
import { format } from 'date-fns';

interface SalesChartProps {
  data: SalesDataPoint[];
  period: '7days' | '30days' | '90days' | '1year';
}

const SalesChart = ({ data, period }: SalesChartProps) => {
  const formatXAxis = (tickItem: string) => {
    if (period === '1year') {
      return format(new Date(tickItem + '-01'), 'MMM yy'); // "YYYY-MM" to "Mon YY"
    } else if (period === '90days') {
      // For weekly data, display start of the week
      const year = tickItem.substring(0, 4);
      const week = parseInt(tickItem.substring(5), 10);
      // This is a simplified way to get a date from week number, might not be exact
      const date = new Date(parseInt(year), 0, 1 + (week - 1) * 7);
      return format(date, 'MMM dd');
    }
    return format(new Date(tickItem), 'MMM dd'); // "YYYY-MM-DD" to "Mon DD"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>Revenue and orders over the last {period.replace('days', ' days').replace('year', ' year')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                minTickGap={30}
                angle={-45}
                textAnchor="end"
                height={60}
                stroke="hsl(var(--foreground))"
              />
              <YAxis yAxisId="left" stroke="hsl(var(--primary))" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'Revenue') return `$${value.toFixed(2)}`;
                  return value.toLocaleString();
                }}
                labelFormatter={(label: string) => `Date: ${formatXAxis(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="hsl(var(--chart-2))"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;