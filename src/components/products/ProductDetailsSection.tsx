"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form';
import type { Category } from '../../types';
import { ProductFormValues } from '../../schemas/productSchema';
import { FormErrorMessage } from '../ui/FormErrorMessage'; // Assuming this exists or creating it if needed

interface ProductDetailsSectionProps {
  categories: Category[];
  isSubmitButtonDisabled: boolean;
}

export const ProductDetailsSection = ({ categories, isSubmitButtonDisabled }: ProductDetailsSectionProps) => {
  const { register, formState: { errors } } = useFormContext<ProductFormValues>();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            {...register('name')}
            disabled={isSubmitButtonDisabled}
          />
          {errors.name && <FormErrorMessage message={errors.name.message} />}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            {...register('category')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={isSubmitButtonDisabled || categories.length === 0}
          >
            {categories.length === 0 ? (
              <option value="">No categories available</option>
            ) : (
              categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))
            )}
          </select>
          {errors.category && <FormErrorMessage message={errors.category.message} />}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          disabled={isSubmitButtonDisabled}
        />
        {errors.description && <FormErrorMessage message={errors.description.message} />}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="featured"
          {...register('isFeatured')}
          className="h-4 w-4"
          disabled={isSubmitButtonDisabled}
        />
        <Label htmlFor="featured">Featured Product</Label>
      </div>
    </div>
  );
};