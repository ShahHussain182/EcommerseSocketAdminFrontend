"use client";

import {  useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Category } from '../../types'; 
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, updateProductSchema, ProductFormValues } from '../../schemas/productSchema';
import { useProductById } from '@/hooks/useProductById';

import { ProductDetailsSection } from './ProductDetailsSection';
import { ProductVariantsSection } from './ProductVariantsSection';
import { ProductImageManager } from './ProductImageManager';

interface ProductFormProps {
  productId?: string;
  onSubmit: (data: ProductFormValues) => void;
  onClose: () => void;
  isSubmitting: boolean;
  categories: Category[];
}

export const ProductForm = ({ productId, onSubmit, onClose, isSubmitting, categories }: ProductFormProps) => {
  const { data: productData, isLoading: isProductLoading, isError, error, refetch } = useProductById(productId);
  const product = productData;

  const formSchema = product ? updateProductSchema : createProductSchema;

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: categories.length > 0 ? categories[0].name : '',
      imageFiles: [],
      imageUrls: [],
      isFeatured: false,
      variants: [{ size: '', color: '', price: 0, stock: 0 }],
    },
  });

  const { reset, handleSubmit, watch } = methods;
  const { getValues, setValue } = methods;

  // autosave: called by ProductImageManager after images upload+refetch
  const handleImagesUploaded = async () => {
    // grab the current form values (imageUrls were updated inside ProductImageManager)
    const values = getValues() as ProductFormValues;
    // call the parent's onSubmit handler
    // (Products.handleUpdateProduct is async and uses mutateAsync)
    onSubmit(values);
  };
  // Sync form state with fetched product data
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        category: product.category,
        imageUrls: product.imageUrls || [],
        imageFiles: [],
        isFeatured: product.isFeatured,
        variants: product.variants && product.variants.length > 0 ? product.variants : [{ size: '', color: '', price: 0, stock: 0 }],
      });
    } else {
      reset({
        name: '',
        description: '',
        category: categories.length > 0 ? categories[0].name : '',
        imageUrls: [],
        imageFiles: [],
        isFeatured: false,
        variants: [{ size: '', color: '', price: 0, stock: 0 }],
      });
    }
  }, [product, reset, categories]);

  const hasUnuploadedFiles = watch('imageFiles')?.length > 0;
  const isProductImageProcessingPending = product?.imageProcessingStatus === 'pending';
  const isAnyOperationPending = isSubmitting || isProductLoading;

  // For update (product exists) we require uploads to be done first.
  // For create (product === undefined) we allow submit with imageFiles (create endpoint expects FormData).
  const isSubmitButtonDisabled = isAnyOperationPending
    || (product ? (hasUnuploadedFiles || isProductImageProcessingPending) : false);

  const handleFormSubmit = async (data: ProductFormValues) => {
    console.debug('[ProductForm.handleFormSubmit] called, productId:', productId, 'hasUnuploadedFiles:', hasUnuploadedFiles);

    if (product && hasUnuploadedFiles) {
      toast.error("Please upload new images before updating the product.");
      return;
    }
    onSubmit(data);
  };

  if (isProductLoading && productId) {

    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading product details...
      </div>
    );
  }

  if (isError && productId) {
    // The error variable is available here because it's destructured from useProductById
    return <p className="text-destructive text-center py-8">Error loading product: {error?.message}</p>;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        
        <ProductDetailsSection 
          categories={categories} 
          isSubmitButtonDisabled={isSubmitButtonDisabled} 
        />

        <ProductImageManager
          product={product}
          isAnyOperationPending={isAnyOperationPending}
          refetchProduct={refetch}
          onImagesUploaded={handleImagesUploaded}
        />

        <ProductVariantsSection 
          isSubmitButtonDisabled={isSubmitButtonDisabled} 
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isAnyOperationPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitButtonDisabled}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? 'Update' : 'Create'} Product
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
};