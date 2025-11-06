import { api } from '@/lib/api';
import type { Order, ApiResponse, OrderStatus, SalesDataPoint, TopProductData } from '@/types'; // Import OrderStatus, SalesDataPoint, TopProductData
 // Import OrderStatus, SalesDataPoint, TopProductData

interface GetAllOrdersParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  statusFilter?: OrderStatus | 'All'; // Add status filter
  sortBy?: 'date' | 'total'; // Add sort by
  sortOrder?: 'asc' | 'desc'; // Add sort order
}

interface GetSalesDataParams {
  period?: '7days' | '30days' | '90days' | '1year';
}

interface GetTopSellingProductsParams {
  limit?: number;
  sortBy?: 'revenue' | 'quantity';
}

export const orderService = {
  // Get all orders with pagination, search, and filters
  async getAllOrders(params: GetAllOrdersParams = {}): Promise<{ data: Order[]; totalOrders: number; nextPage: number | null }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/orders/admin?${queryParams.toString()}`); // Use /orders/admin endpoint
    return response.data;
  },

  // Get single order by ID
  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Update order status (Admin function)
  async updateOrderStatus(id: string, status: string): Promise<ApiResponse<Order>> {
    const response = await api.put(`/orders/${id}`, { status });
    return response.data;
  },

  // Get order analytics/metrics (Admin function)
  async getOrderMetrics(): Promise<any> {
    const response = await api.get('/orders/metrics');
    return response.data;
  },

  // New: Get sales data over time for charting
  async getSalesDataOverTime(params: GetSalesDataParams = {}): Promise<{ data: SalesDataPoint[] }> {
    const queryParams = new URLSearchParams();
    if (params.period) {
      queryParams.append('period', params.period);
    }
    const response = await api.get(`/orders/sales-over-time?${queryParams.toString()}`);
    return response.data;
  },

  // New: Get top-selling products
  async getTopSellingProducts(params: GetTopSellingProductsParams = {}): Promise<{ data: TopProductData[] }> {
    const queryParams = new URLSearchParams();
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    const response = await api.get(`/orders/top-selling-products?${queryParams.toString()}`);
    return response.data;
  },
};