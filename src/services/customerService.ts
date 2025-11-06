import { api } from '@/lib/api';
import type { User, ApiResponse } from '@/types';

interface GetAllCustomersParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  statusFilter?: 'Active' | 'Inactive' | 'VIP' | 'New' | 'Potential' | 'All';
  sortBy?: 'userName' | 'email' | 'createdAt' | 'lastLogin' | 'totalOrders' | 'totalSpent';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedCustomersResponse {
  data: User[];
  totalCustomers: number;
  nextPage: number | null;
}

// New type for update payload, based on backend schema
interface UpdateCustomerData {
  userName?: string;
  email?: string;
  phoneNumber?: string;
}

export const customerService = {
  /**
   * Fetches all customers (users with role 'user') with pagination, search, and filters.
   */
  async getAllCustomers(params: GetAllCustomersParams = {}): Promise<PaginatedCustomersResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/customers?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Updates a customer's information (Admin only).
   * Uses the new /api/v1/admin/users/:id endpoint.
   * @param customerId The ID of the customer to update.
   * @param data The data to update.
   */
  async updateCustomer(customerId: string, data: UpdateCustomerData): Promise<ApiResponse<User>> {
    const response = await api.put(`/admin/users/${customerId}`, data);
    return response.data;
  }
};