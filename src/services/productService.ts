import { api } from '@/lib/api';
import type { Product, ApiResponse, PaginatedProductsResponse, ProductsFilterState } from '@/types'; 
import { createProductSchema, updateProductSchema } from '../schemas/productSchema';
import { z } from 'zod';

// Define types for product creation and update based on Zod schemas
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;

export const productService = {
  // Get all products with pagination, search, and filters
  async getProducts(params: ProductsFilterState = {}): Promise<PaginatedProductsResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/products?${queryParams.toString()}`);
    return response.data;
  },

  // Get single product by ID
  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Get featured products
  async getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
    const response = await api.get('/products/featured');
    return response.data;
  },

  // Create new product (Admin only)
  async createProduct(productData: FormData): Promise<ApiResponse<Product>> {
    const response = await api.post('/products', productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update product (Admin only)
  async updateProduct(id: string, productData: UpdateProductData): Promise<ApiResponse<Product>> {
    console.debug('[productService.updateProduct] called with id', id);
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product (Admin only)
  async deleteProduct(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Uploads multiple image files to the backend's S3 upload endpoint and updates the product.
   * @param productId The ID of the product to update.
   * @param files An array of File objects to upload.
   * @returns A promise that resolves to the updated Product object.
   */
  async uploadProductImages(productId: string, files: File[]): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await api.post(`/products/${productId}/upload-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Deletes a specific product image from S3 and updates the product document.
   * @param productId The ID of the product.
   * @param imageUrl The URL of the image to delete.
   * @returns A promise that resolves to the updated Product object.
   */
  async deleteProductImage(productId: string, imageUrl: string): Promise<ApiResponse<Product>> {
    const response = await api.delete(`/products/${productId}/images`, {
      params: { imageUrl },
    });
    return response.data;
  },
};