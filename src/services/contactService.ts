import { api } from '@/lib/api';
import type {  PaginatedContactMessagesResponse, ApiResponse } from '@/types';

interface GetAllMessagesParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
}

export const contactService = {
  /**
   * Fetches all contact messages with pagination and search (Admin only).
   */
  async getAllMessages(params: GetAllMessagesParams = {}): Promise<PaginatedContactMessagesResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    // Use the new admin endpoint
    const response = await api.get(`/admin/contact-messages?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Deletes a specific contact message (Admin only).
   */
  async deleteMessage(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/admin/contact-messages/${id}`);
    return response.data;
  },
};