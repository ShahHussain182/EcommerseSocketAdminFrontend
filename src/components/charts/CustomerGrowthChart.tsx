import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  CartesianGrid,
} from 'recharts';
import type { CustomerGrowthDataPoint } from '@/types';
import { format } from 'date-fns';

interface CustomerGrowthChartProps {
  data: CustomerGrowthDataPoint[];
  period: '7days' | '30days' | '1year';
}

const CustomerGrowthChart = ({ data, period }: CustomerGrowthChartProps) => {
  const formatXAxis = (tickItem: string) => {
    if (period === '1year') {
      return format(new Date(tickItem + '-01'), 'MMM yy'); // "YYYY-MM" to "Mon YY"
    }
    return format(new Date(tickItem), 'MMM dd'); // "YYYY-MM-DD" to "Mon DD"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Growth</CardTitle>
        <CardDescription>New customers over the last {period.replace('days', ' days').replace('year', ' year')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
              <YAxis stroke="hsl(var(--chart-3))" />
              <Tooltip
                formatter={(value: number) => value.toLocaleString()}
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
              <Bar dataKey="newCustomers" name="New Customers" fill="hsl(var(--chart-3))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerGrowthChart;