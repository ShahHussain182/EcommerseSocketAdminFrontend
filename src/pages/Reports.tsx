import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, FileText, Users, Package, DollarSign, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Label } from '@/components/ui/label';
import { reportService } from '@/services/reportService'; // Import reportService
import { useMutation } from '@tanstack/react-query'; // Import useMutation

export function Reports() {
  const [salesReportPeriod, setSalesReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [customerReportType, setCustomerReportType] = useState<'all' | 'new' | 'vip' | 'potential' | 'inactive'>('all');
  const [inventoryReportType, setInventoryReportType] = useState<'all' | 'low_stock' | 'top_selling'>('all');

  // Helper function to trigger file download
  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Sales Report Mutation
  const salesReportMutation = useMutation({
    mutationFn: reportService.generateSalesReport,
    onSuccess: (blob, variables) => {
      const filename = `sales_report_${variables.period}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadFile(blob, filename);
      toast.success('Sales report generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate sales report.');
    },
  });

  // Customer Report Mutation
  const customerReportMutation = useMutation({
    mutationFn: reportService.generateCustomerReport,
    onSuccess: (blob, variables) => {
      const filename = `customer_report_${variables.type}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadFile(blob, filename);
      toast.success('Customer report generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate customer report.');
    },
  });

  // Inventory Report Mutation
  const inventoryReportMutation = useMutation({
    mutationFn: reportService.generateInventoryReport,
    onSuccess: (blob, variables) => {
      const filename = `inventory_report_${variables.type}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadFile(blob, filename);
      toast.success('Inventory report generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate inventory report.');
    },
  });

  // Order History Report Mutation
  const orderHistoryReportMutation = useMutation({
    mutationFn: reportService.generateOrderHistoryReport,
    onSuccess: (blob) => {
      const filename = `order_history_report_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadFile(blob, filename);
      toast.success('Order history report generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate order history report.');
    },
  });

  // Review Summary Report Mutation
  const reviewSummaryReportMutation = useMutation({
    mutationFn: reportService.generateReviewSummaryReport,
    onSuccess: (blob) => {
      const filename = `review_summary_report_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadFile(blob, filename);
      toast.success('Review summary report generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate review summary report.');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
      <p className="text-muted-foreground">Generate and download various reports for your store.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sales Reports Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" /> Sales Reports
            </CardTitle>
            <CardDescription>Detailed sales data by period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sales-period">Select Period</Label>
              <Select value={salesReportPeriod} onValueChange={(value) => setSalesReportPeriod(value as typeof salesReportPeriod)}>
                <SelectTrigger id="sales-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => salesReportMutation.mutate({ period: salesReportPeriod })}
              disabled={salesReportMutation.isPending}
            >
              {salesReportMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Sales Report
            </Button>
          </CardContent>
        </Card>

        {/* Customer Reports Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" /> Customer Reports
            </CardTitle>
            <CardDescription>Insights into your customer base.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-type">Select Type</Label>
              <Select value={customerReportType} onValueChange={(value) => setCustomerReportType(value as typeof customerReportType)}>
                <SelectTrigger id="customer-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="new">New Customers</SelectItem>
                  <SelectItem value="vip">VIP Customers</SelectItem>
                  <SelectItem value="potential">Potential Customers</SelectItem>
                  <SelectItem value="inactive">Inactive Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => customerReportMutation.mutate({ type: customerReportType })}
              disabled={customerReportMutation.isPending}
            >
              {customerReportMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Customer Report
            </Button>
          </CardContent>
        </Card>

        {/* Inventory Reports Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" /> Inventory Reports
            </CardTitle>
            <CardDescription>Manage your product stock and performance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inventory-type">Select Type</Label>
              <Select value={inventoryReportType} onValueChange={(value) => setInventoryReportType(value as typeof inventoryReportType)}>
                <SelectTrigger id="inventory-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="low_stock">Low Stock Products</SelectItem>
                  <SelectItem value="top_selling">Top Selling Products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => inventoryReportMutation.mutate({ type: inventoryReportType })}
              disabled={inventoryReportMutation.isPending}
            >
              {inventoryReportMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Inventory Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* General Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" /> General Reports
          </CardTitle>
          <CardDescription>Other useful reports for your business.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => orderHistoryReportMutation.mutate()}
            disabled={orderHistoryReportMutation.isPending}
          >
            {orderHistoryReportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Order History Report
          </Button>
          <Button
            variant="outline"
            onClick={() => reviewSummaryReportMutation.mutate()}
            disabled={reviewSummaryReportMutation.isPending}
          >
            {reviewSummaryReportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Review Summary Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}