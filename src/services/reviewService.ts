import { api } from '@/lib/api';
import type { Review, ApiResponse } from '@/types';
import { updateReviewSchema } from '@/schemas/reviewSchema'; // Import Zod schema
import { z } from 'zod';

export type UpdateReviewData = z.infer<typeof updateReviewSchema>;

interface AllReviewsParams {
  page?: number;
  limit?: number;
  searchTerm?: string; // Search by product name
  rating?: number; // Filter by rating
}

interface PaginatedReviewsResponse {
  reviews: Review[];
  totalReviews: number;
  nextPage: number | null;
}

export const reviewService = {
  /**
   * Fetches all reviews with pagination and filters (for admin).
   */
  async getAllReviews(params: AllReviewsParams = {}): Promise<PaginatedReviewsResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/reviews?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Updates an existing review (Admin only).
   */
  async updateReview(reviewId: string, reviewData: UpdateReviewData): Promise<ApiResponse<Review>> {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  /**
   * Deletes a review (Admin only).
   */
  async deleteReview(reviewId: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};