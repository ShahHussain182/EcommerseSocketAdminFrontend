"use client";

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productService, UpdateProductData } from '../services/productService';
import type { Product } from '@/types';
import { ProductFormValues } from '../schemas/productSchema';
import { ProductsHeader } from '../components/products/ProductsHeader';
import { ProductsFilterBar } from '../components/products/ProductsFilterBar';
import { ProductsTable } from '../components/products/ProductsTable';
import { ProductViewDialog } from '../components/products/ProductViewDialog';
import { ProductForm } from '../components/products/ProductForm';
import { useCategories } from '@/hooks/useCategories';
import { useProcessingPoll } from '@/hooks/useProcessingPoll';
import { QueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDebounce } from 'use-debounce';
// call from anywhere with access to queryClient
function upsertProductInAllProductCaches(queryClient: QueryClient, updatedProduct: any) {
  const allQueries = queryClient.getQueryCache().getAll();
  let replacedInAny = false;

  for (const q of allQueries) {
    const qKey = q.queryKey;
    if (!Array.isArray(qKey) || qKey[0] !== 'products') continue;

    const qData = queryClient.getQueryData(qKey);
    if (!qData) continue;

    try {
      const pageData = qData as any;
      if (!Array.isArray(pageData.products)) continue;

      const newProducts = pageData.products.map((p: any) => {
        const matches =
          (p._id && String(p._id) === String(updatedProduct._id)) ||
          (p.id && String(p.id) === String(updatedProduct.id));
        if (matches) {
          replacedInAny = true;
          return { ...p, ...updatedProduct };
        }
        return p;
      });

      if (replacedInAny) {
        const newPage = { ...pageData, products: newProducts };
        queryClient.setQueryData(qKey, newPage);
        // keep going — product could exist in multiple cached pages
      }
    } catch (e) {
      // ignore non-standard shapes
      // eslint-disable-next-line no-console
      console.debug('[upsert] ignored non-standard page shape', qKey, e);
    }
  }

  // Update single-product caches (both key variants)
  if (updatedProduct._id) queryClient.setQueryData(['product', updatedProduct._id], updatedProduct);
  if (updatedProduct.id) queryClient.setQueryData(['product', updatedProduct.id], updatedProduct);

  return replacedInAny;
}
export function Products() {
  const productsQueryKey = (opts: {
    searchTerm?: string;
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    includeProcessing?: boolean;
    isAdminView?: boolean;
  }) => [
    'products',
    {
      searchTerm: opts.searchTerm || undefined,
      category: opts.category || undefined,
      page: opts.page ?? 1,
      limit: opts.limit ?? limit,
      sortBy: opts.sortBy ?? sortBy,
      includeProcessing: opts.includeProcessing ?? true,
      isAdminView: opts.isAdminView ?? true, // admin dashboard uses true
    },
  ] as const;
  const queryClient = useQueryClient();
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [selectedCategory, setSelectedCategory] = useState('');
  type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'averageRating-desc'
  | 'numberOfReviews-desc'
  | 'relevance-desc'
  | 'createdAt-desc';

const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null); // Store only ID

  // Query for products from API
  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: productsQueryKey({
      searchTerm: debouncedSearchTerm,
      category: selectedCategory,
      page,
      limit,
      sortBy,
      includeProcessing: true,
      isAdminView: true,
    }),
    queryFn: () => productService.getProducts({
      page,
      limit,
      searchTerm: debouncedSearchTerm || undefined,
      categories: selectedCategory || undefined,
      sortBy,
      includeProcessing: true, // <-- show pending/processing products in admin UI
    }),
    staleTime: 5 * 60 * 1000,
  });

  const products = productsData?.products || []; // Corrected: Access 'products' key
  const totalProducts = productsData?.totalProducts || 0; // Corrected: Access 'totalProducts' key
  const totalPages = Math.ceil(totalProducts / limit);
  const { startPoll } = useProcessingPoll();
  // Mutations for CRUD operations
  const createProductMutation = useMutation({
    mutationFn: (formData: FormData) => productService.createProduct(formData),
    onSuccess: async (response) => {
      const newProduct = response?.product;
      toast.success('Product created successfully! Images are being processed in the background.');
    
      // Admin UX: show newest-first and jump to page 1
      setSortBy('createdAt-desc');
      setPage(1);
      setIsAddDialogOpen(false);
    
      // Build admin query key for newest-first page 1
      const adminQueryKeyForPage1 = productsQueryKey({
        searchTerm: debouncedSearchTerm,
        category: selectedCategory,
        page: 1,
        limit,
        sortBy: 'createdAt-desc',
        includeProcessing: true,
        isAdminView: true,
      });
    
      try {
        const prev = queryClient.getQueryData(adminQueryKeyForPage1) as any | undefined;
    
        if (prev && newProduct) {
          // Already have page 1 cached — just prepend optimistically
          const already = (prev.products || []).some((p: any) => p._id === newProduct._id);
          if (!already) {
            const updatedProducts = [newProduct, ...(prev.products || [])].slice(0, limit);
            const updatedTotal =
              typeof prev.totalProducts === 'number'
                ? prev.totalProducts + 1
                : (prev.products?.length || 0) + 1;
            const updated = { ...prev, products: updatedProducts, totalProducts: updatedTotal };
            queryClient.setQueryData(adminQueryKeyForPage1, updated);
          }
        } else if (newProduct) {
          // No cached page 1 — fetch from server to avoid flicker of "Products (1)"
          const fetched = await queryClient.fetchQuery({
            queryKey: adminQueryKeyForPage1,
            queryFn: () =>
              productService.getProducts({
                page: 1,
                limit,
                sortBy: 'createdAt-desc',
                searchTerm: debouncedSearchTerm || undefined,
                categories: selectedCategory || undefined,
                includeProcessing: true,
              }),
          });
    
          const already = (fetched.products || []).some((p: any) => p._id === newProduct._id);
          const mergedProducts = already ? fetched.products : [newProduct, ...(fetched.products || [])];
          const trimmed = mergedProducts.slice(0, limit);
          const updatedTotal =
            typeof fetched.totalProducts === 'number'
              ? fetched.totalProducts + (already ? 0 : 1)
              : trimmed.length;
          const updated = { ...fetched, products: trimmed, totalProducts: updatedTotal };
          queryClient.setQueryData(adminQueryKeyForPage1, updated);
        }
      } catch (e) {
        console.warn('Admin cache optimistic update failed:', e);
      }
    
      // Invalidate only admin product queries to stay isolated from client-side views
      queryClient.invalidateQueries({
        predicate: (query) => {
          const qKey = query.queryKey;
          if (!Array.isArray(qKey) || qKey.length < 2) return false;
          const meta = qKey[1] as any;
          return qKey[0] === 'products' && meta?.isAdminView === true;
        },
      });
    
      if (newProduct) startPoll(newProduct._id, queryClient);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create product');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) =>
      productService.updateProduct(id, data),
  
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries();
  
      const snapshots: Array<{ key: unknown; data: unknown }> = [];
      const allQueries = queryClient.getQueryCache().getAll();
  
      for (const q of allQueries) {
        const qKey = q.queryKey;
        if (!Array.isArray(qKey) || qKey[0] !== 'products') continue;
  
        const qData = queryClient.getQueryData(qKey);
        snapshots.push({ key: qKey, data: qData });
  
        if (!qData) continue;
        try {
          const pageData = qData as any;
          if (!Array.isArray(pageData.products)) continue;
  
          const patched = {
            ...pageData,
            products: pageData.products.map((p: any) =>
              p._id === id ? { ...p, ...data } : p
            ),
          };
  
          queryClient.setQueryData(qKey, patched);
        } catch (e) {
          // ignore odd shapes
        }
      }
  
      return { snapshots };
    },
  
    onError: (err: any, variables, context: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update product');
      if (context?.snapshots) {
        for (const s of context.snapshots) {
          queryClient.setQueryData(s.key, s.data);
        }
      }
    },
  
    onSuccess: (response: any) => {
      const updatedProduct = response?.product;
      // eslint-disable-next-line no-console
      console.debug('[updateProduct:onSuccess] server product:', updatedProduct);
  
      if (!updatedProduct) {
        toast.success('Product updated');
        setIsEditDialogOpen(false);
        return;
      }
  
      // Try to upsert in all cached paginated lists
      const replaced = upsertProductInAllProductCaches(queryClient, updatedProduct);
  
      if (!replaced) {
        // Not found — log keys for debugging and invalidate lists so UI refetches
        // eslint-disable-next-line no-console
        console.debug('[updateProduct:onSuccess] product not found in cached pages. Query keys:', queryClient.getQueryCache().getAll().map(q => q.queryKey));
        queryClient.invalidateQueries({
          predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'products',
        });
      } else {
        // eslint-disable-next-line no-console
        console.debug('[updateProduct:onSuccess] product replaced in cache');
      }
  
      // Ensure single-product caches are up to date
      if (updatedProduct._id) queryClient.setQueryData(['product', updatedProduct._id], updatedProduct);
      if (updatedProduct.id) queryClient.setQueryData(['product', updatedProduct.id], updatedProduct);
  
      toast.success('Product updated successfully');
      setIsEditDialogOpen(false);
  
      // If server says it's still pending and you want to poll:
      if (updatedProduct.imageProcessingStatus === 'pending') {
        // make sure startPoll exists in scope (you declared it earlier from useProcessingPoll)
        try { startPoll(updatedProduct._id, queryClient); } catch (e) { /* ignore if not available */ }
      }
    },
  
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'products',
      });
    },
  });

 // Replace your current handleCreateProduct with this
const handleCreateProduct = (data: ProductFormValues) => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('description', data.description);
  formData.append('category', data.category);
  formData.append('isFeatured', String(data.isFeatured));

  // Append image files
  (data.imageFiles || []).forEach((file) => {
    formData.append('images', file);
  });

  // Sanitize variants: only keep variants that have something meaningful
  const rawVariants = data.variants || [];
  const meaningfulVariants = rawVariants.filter(v =>
    (v.size && v.size.toString().trim() !== '') ||
    (v.color && v.color.toString().trim() !== '') ||
    (typeof v.price === 'number' && v.price !== 0) ||
    (typeof v.stock === 'number' && v.stock !== 0)
  );

  // If there are meaningful variants, include them. Otherwise omit so backend will set defaults.
  if (meaningfulVariants.length > 0) {
    formData.append('variants', JSON.stringify(meaningfulVariants));
  }

  createProductMutation.mutate(formData);
};

  const handleUpdateProduct = async (data: ProductFormValues) => {
    if (selectedProductId) {
      const updateData: UpdateProductData = {
        name: data.name,
        description: data.description,
        category: data.category,
        isFeatured: data.isFeatured,
        variants: data.variants,
        imageUrls: data.imageUrls,
      };
      try {
        const resp = await updateProductMutation.mutateAsync({ id: selectedProductId, data: updateData });
        console.debug('[Products.handleUpdateProduct] mutateAsync response', resp);
      } catch (err) {
        console.debug('[Products.handleUpdateProduct] mutateAsync error', err);
      }
    }
  };

  // Find the actual product object for the view dialog based on selectedProductId
  const productToView = products.find(p => p._id === selectedProductId) || null;

  return (
    <div className="space-y-6">
      <ProductsHeader
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        categories={categories || []}
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        onSubmit={handleCreateProduct}
        isSubmitting={createProductMutation.isPending}
      />

      <ProductsFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categories || []}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        setPage={setPage}
      />

      <ProductsTable
        products={products}
        isLoading={isLoading}
        error={error}
        totalProducts={totalProducts}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        onEditProduct={(product) => {
          setSelectedProductId(product._id);
          setIsEditDialogOpen(true);
        }}
        onViewProduct={(product) => {
          setSelectedProductId(product._id);
          setIsViewDialogOpen(true);
        }}
        debouncedSearchTerm={debouncedSearchTerm}
        selectedCategory={selectedCategory}
        sortBy={sortBy}
      />

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details, variants, and images.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            productId={selectedProductId || undefined} // Pass productId
            onSubmit={handleUpdateProduct}
            onClose={() => setIsEditDialogOpen(false)}
            isSubmitting={updateProductMutation.isPending}
            categories={categories || []}
          />
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <ProductViewDialog
        isOpen={isViewDialogOpen}
        setIsOpen={setIsViewDialogOpen}
        product={productToView} // Pass the found product object
      />
    </div>
  );
}