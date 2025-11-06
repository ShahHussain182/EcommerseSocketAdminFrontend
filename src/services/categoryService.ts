import { api } from '@/lib/api';
import type { Category, ApiResponse } from '@/types';
import { z } from 'zod';

// Zod schemas for category creation and update
export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters.").max(50, "Category name cannot exceed 50 characters."),
  description: z.string().max(500, "Category description cannot exceed 500 characters.").optional(),
}).strict();

export const updateCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters.").max(50, "Category name cannot exceed 50 characters.").optional(),
  description: z.string().max(500, "Category description cannot exceed 500 characters.").optional(),
}).strict().partial();

export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;

export const categoryService = {
  /**
   * Fetches all categories.
   */
  async getAllCategories(): Promise<{ categories: Category[] }> {
    const response = await api.get('/categories');
    return response.data;
  },

  /**
   * Creates a new category.
   */
  async createCategory(data: CreateCategoryData): Promise<ApiResponse<Category>> {
    const response = await api.post('/categories', data);
    return response.data;
  },

  /**
   * Updates an existing category.
   */
  async updateCategory(id: string, data: UpdateCategoryData): Promise<ApiResponse<Category>> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Deletes a category.
   */
  async deleteCategory(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};