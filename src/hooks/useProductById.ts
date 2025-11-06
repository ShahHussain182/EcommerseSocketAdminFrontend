import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import type { Product } from '@/types';

export const useProductById = (productId: string | undefined) => {
  return useQuery<Product, Error>({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId!).then(res => res.product!),
    enabled: !!productId, // Only run the query if productId is provided
    staleTime: 0, // Set staleTime to 0 to always refetch when invalidated
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
    // Add refetchInterval to poll when image processing is pending
    refetchInterval: (query) => {
      const product = query.state.data;
      // Poll every 3 seconds if product exists and its imageProcessingStatus is 'pending'
      return product && product.imageProcessingStatus === 'pending' ? 3000 : false;
    },
  });
};