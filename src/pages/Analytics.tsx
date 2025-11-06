import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { orderService } from '@/services/orderService';
import { customerService } from '@/services/customerService'; // Import customerService
import SalesChart from '@/components/charts/SalesChart';
import TopSellingProducts from '@/components/dashboard/TopSellingProducts';
import CustomerGrowthChart from '@/components/charts/CustomerGrowthChart'; // Import new chart
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Analytics() {
  const [salesPeriod, setSalesPeriod] = useState<'7days' | '30days' | '90days' | '1year'>('30days');
  const [customerGrowthPeriod, setCustomerGrowthPeriod] = useState<'7days' | '30days' | '1year'>('30days');

  // Query for sales data over time
  const { data: salesChartData, isLoading: salesChartLoading } = useQuery({
    queryKey: ['sales-over-time', salesPeriod],
    queryFn: () => orderService.getSalesDataOverTime({ period: salesPeriod }),
    staleTime: 5 * 60 * 1000,
  });

  // Query for top selling products
  const { data: topSellingProductsData, isLoading: topSellingProductsLoading } = useQuery({
    queryKey: ['top-selling-products'],
    queryFn: () => orderService.getTopSellingProducts({ limit: 5, sortBy: 'revenue' }),
    staleTime: 5 * 60 * 1000,
  });

  // Query for customer growth data over time
  const { data: customerGrowthData, isLoading: customerGrowthLoading } = useQuery({
    queryKey: ['customer-growth-over-time', customerGrowthPeriod],
    queryFn: () => customerService.getCustomerGrowthOverTime({ period: customerGrowthPeriod }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
      <p className="text-muted-foreground">Deep dive into your store's performance metrics.</p>

      {/* Sales Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex justify-end mb-4">
            <Select value={salesPeriod} onValueChange={(value) => setSalesPeriod(value as typeof salesPeriod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {salesChartLoading ? (
            <Card className="h-[380px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ) : (
            <SalesChart data={salesChartData?.data || []} period={salesPeriod} />
          )}
        </div>

        {/* Top Selling Products */}
        <div>
          <TopSellingProducts data={topSellingProductsData?.data || []} isLoading={topSellingProductsLoading} />
        </div>
      </div>

      {/* Customer Growth Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="flex justify-end mb-4">
            <Select value={customerGrowthPeriod} onValueChange={(value) => setCustomerGrowthPeriod(value as typeof customerGrowthPeriod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {customerGrowthLoading ? (
            <Card className="h-[380px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ) : (
            <CustomerGrowthChart data={customerGrowthData?.data || []} period={customerGrowthPeriod} />
          )}
        </div>

        {/* Placeholder for other analytics cards */}
        <Card>
          <CardHeader>
            <CardTitle>Other Insights</CardTitle>
            <CardDescription>More analytics coming soon...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">Placeholder for additional charts or metrics.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}