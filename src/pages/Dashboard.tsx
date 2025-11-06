import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  TrendingUp,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { orderService } from '@/services/orderService';
import SalesChart from '@/components/charts/SalesChart'; // New import
import TopSellingProducts from '@/components/dashboard/TopSellingProducts'; // New import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import type { Order } from '@/types'; // Import the Order type
 // Import the Order type

function MetricCard({ 
  title, 
  value, 
  growth, 
  icon: Icon,
  prefix = '' 
}: { 
  title: string; 
  value: number; 
  growth: number; 
  icon: any;
  prefix?: string;
}) {
  const isPositive = growth > 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{value.toLocaleString()}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          {isPositive ? (
            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
          )}
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(growth)}%
          </span>
          <span className="ml-1">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const [salesPeriod, setSalesPeriod] = useState<'7days' | '30days' | '90days' | '1year'>('30days');

  // Query for dashboard metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: orderService.getOrderMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  const metrics = metricsData || {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    totalCustomers: 0,
    customersGrowth: 0,
    totalProducts: 0,
    productsGrowth: 0,
    recentOrders: [],
  };

  const recentOrders = metrics.recentOrders || [];

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <h3 className="mt-4 text-lg font-semibold">Loading dashboard...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={metrics.totalRevenue}
          growth={metrics.revenueGrowth}
          icon={DollarSign}
          prefix="$"
        />
        <MetricCard
          title="Orders"
          value={metrics.totalOrders}
          growth={metrics.ordersGrowth}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Customers"
          value={metrics.totalCustomers}
          growth={metrics.customersGrowth}
          icon={Users}
        />
        <MetricCard
          title="Products"
          value={metrics.totalProducts}
          growth={metrics.productsGrowth}
          icon={Package}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Sales Over Time Chart */}
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Latest orders from your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent orders.</p>
            ) : (
              recentOrders.map((order: Order) => (
                <div key={order._id} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">#{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.userId?.userName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium">${order.totalAmount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'yyyy-MM-dd')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Delivered':
      return 'default';
    case 'Processing':
      return 'secondary';
    case 'Shipped':
      return 'outline';
    case 'Pending':
      return 'destructive';
    case 'Cancelled':
      return 'destructive';
    default:
      return 'default';
  }
};