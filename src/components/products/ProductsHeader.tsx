"use client";

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Category, Product } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProductForm } from './ProductForm';
import { ProductFormValues } from '../../schemas/productSchema';
import { Loader2 } from 'lucide-react';

interface ProductsHeaderProps {
  categoriesLoading: boolean;
  categoriesError: Error | null;
  categories: Category[];
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (isOpen: boolean) => void;
  onSubmit: (data: ProductFormValues) => void;
  isSubmitting: boolean;
}

export const ProductsHeader = ({
  categoriesLoading,
  categoriesError,
  categories,
  isAddDialogOpen,
  setIsAddDialogOpen,
  onSubmit,
  isSubmitting,
}: ProductsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">Manage your product inventory and details</p>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button
            disabled={categoriesLoading || !!categoriesError || categories.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product with variants, pricing, and inventory details. At least one image is required.
            </DialogDescription>
          </DialogHeader>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading categories...
            </div>
          ) : categoriesError ? (
            <p className="text-destructive text-center py-8">Error loading categories: {categoriesError.message}</p>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No categories available. Please create categories first.</p>
          ) : (
            <ProductForm
            onSubmit={onSubmit}
            onClose={() => setIsAddDialogOpen(false)}
            isSubmitting={isSubmitting}
            categories={categories}
          />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};