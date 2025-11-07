import { api } from '@/lib/api';


interface SalesReportParams {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface CustomerReportParams {
  type?: 'all' | 'new' | 'vip' | 'potential' | 'inactive';
}

interface InventoryReportParams {
  type?: 'all' | 'low_stock' | 'top_selling';
}

export const reportService = {
  /**
   * Generates and downloads a Sales Report CSV.
   */
  async generateSalesReport(params: SalesReportParams): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params.period) {
      queryParams.append('period', params.period);
    }
    const response = await api.get(`/reports/sales?${queryParams.toString()}`, {
      responseType: 'blob', // Important for file downloads
    });
    return response.data;
  },

  /**
   * Generates and downloads a Customer Report CSV.
   */
  async generateCustomerReport(params: CustomerReportParams): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params.type) {
      queryParams.append('type', params.type);
    }
    const response = await api.get(`/reports/customers?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generates and downloads an Inventory Report CSV.
   */
  async generateInventoryReport(params: InventoryReportParams): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params.type) {
      queryParams.append('type', params.type);
    }
    const response = await api.get(`/reports/inventory?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generates and downloads an Order History Report CSV.
   */
  async generateOrderHistoryReport(): Promise<Blob> {
    const response = await api.get(`/reports/order-history`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generates and downloads a Review Summary Report CSV.
   */
  async generateReviewSummaryReport(): Promise<Blob> {
    const response = await api.get(`/reports/review-summary`, {
      responseType: 'blob',
    });
    return response.data;
  },
};