import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {  Edit, Trash2, Eye, Star, Package, Loader2, ChevronLeft, ChevronRight, MoreHorizontal, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService, UpdateProductData } from '../../services/productService';
import type { Product, ProductVariant, ApiResponse, PaginatedProductsResponse } from '../../types';

const getTotalStock = (variants?: ProductVariant[]) => {
  return variants?.reduce((total, variant) => total + variant.stock, 0) || 0;
};

const getMinPrice = (variants?: ProductVariant[]) => {
  return variants && variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0;
};

const getStockStatus = (totalStock: number) => {
  if (totalStock === 0) return { status: 'Out of Stock', variant: 'destructive' as const };
  if (totalStock < 10) return { status: 'Low Stock', variant: 'secondary' as const };
  return { status: 'In Stock', variant: 'default' as const };
};

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  totalProducts: number;
  totalPages: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  debouncedSearchTerm: string;
  selectedCategory: string;
  sortBy: string;
}

export const ProductsTable = ({
  products,
  isLoading,
  error,
  totalProducts,
  totalPages,
  page,
  setPage,
  onEditProduct,
  onViewProduct,
  debouncedSearchTerm,
  selectedCategory,
  sortBy,
}: ProductsTableProps) => {
  const queryClient = useQueryClient();

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) => productService.updateProduct(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previousProducts = queryClient.getQueryData(['products', { searchTerm: debouncedSearchTerm, category: selectedCategory, page, limit: 10, sortBy }]);

      queryClient.setQueryData(
        ['products', { searchTerm: debouncedSearchTerm, category: selectedCategory, page, limit: 10, sortBy }],
        (oldData: PaginatedProductsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            products: oldData.products.map((product) =>
              product._id === id ? { ...product, ...data } : product
            ),
          };
        }
      );
      return { previousProducts };
    },
    onSuccess: () => {
      toast.success('Product updated successfully');
    },
    onError: (err: any, ) => {
      toast.error(err.response?.data?.message || 'Failed to update product');
     
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onMutate: async (productIdToDelete: string) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previousProducts = queryClient.getQueryData(['products', { searchTerm: debouncedSearchTerm, category: selectedCategory, page, limit: 10, sortBy }]);
  
      queryClient.setQueryData(
        ['products', { searchTerm: debouncedSearchTerm, category: selectedCategory, page, limit: 10, sortBy }],
        (oldData: PaginatedProductsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            products: oldData.products.filter((product) => product._id !== productIdToDelete),
            totalProducts: oldData.totalProducts - 1,
          };
        }
      );
      toast.loading('Deleting product...', { id: productIdToDelete });
      return { previousProducts };
    },
    onSuccess: (_data: ApiResponse<null>, productIdToDelete: string) => {
      toast.success('Product deleted successfully', { id: productIdToDelete });
    },
    onError: (err: any, productIdToDelete: string, context) => {
      toast.error(err.response?.data?.message || 'Failed to delete product', { id: productIdToDelete });
      if (context?.previousProducts) {
        queryClient.setQueryData(
          ['products', { searchTerm: debouncedSearchTerm, category: selectedCategory, page, limit: 10, sortBy }],
          context.previousProducts
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleToggleFeatured = async (product: Product) => {
    updateProductMutation.mutate({
      id: product._id,
      data: { isFeatured: !product.isFeatured },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products ({totalProducts})</CardTitle>
        <CardDescription>
          View and manage all your products in one place
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Product</TableHead><TableHead className="min-w-[100px]">Category</TableHead><TableHead className="min-w-[100px]">Price</TableHead><TableHead className="min-w-[80px]">Stock</TableHead><TableHead className="min-w-[100px]">Rating</TableHead><TableHead className="min-w-[120px]">Status</TableHead><TableHead className="min-w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                        <h3 className="mt-4 text-lg font-semibold">Loading products...</h3>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Package className="mx-auto h-12 w-12 text-destructive" />
                        <h3 className="mt-4 text-lg font-semibold">Error loading products</h3>
                        <p className="text-muted-foreground mb-4">There was an issue fetching the products.</p>
                        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}>Try Again</Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No products found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const totalStock = getTotalStock(product.variants);
                  const minPrice = getMinPrice(product.variants);
                  const stockStatus = getStockStatus(totalStock);
                  const isImageProcessingPending = product.imageProcessingStatus === 'pending';

                  const displayImageUrl = isImageProcessingPending 
                    ? '/placeholder.svg' // Placeholder for pending images
                    : product.imageRenditions[0]?.thumbnail || product.imageUrls[0] || '/placeholder.svg';

                  return (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          {isImageProcessingPending ? (
                            <div className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-md">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                          ) : (
                            <img
                              src={displayImageUrl}
                              alt={product.name}
                              className="h-8 w-8 rounded-md object-cover"
                            />
                          )}
                          <div className="font-medium">{product.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {product.variants && product.variants.length > 0 ? `$${minPrice.toFixed(2)}` : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{totalStock}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{product.averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({product.numberOfReviews})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={stockStatus.variant}>{stockStatus.status}</Badge>
                          {product.isFeatured && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                          {isImageProcessingPending && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Processing
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewProduct(product)}
                            disabled={isImageProcessingPending}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isImageProcessingPending}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleFeatured(product)} disabled={updateProductMutation.isPending}>
                                {product.isFeatured ? (
                                  <>
                                    <X className="mr-2 h-4 w-4" /> Unfeature
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" /> Feature
                                  </>
                                )}
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the product "{product.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteProductMutation.mutate(product._id)} disabled={deleteProductMutation.isPending}>
                                      {deleteProductMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};