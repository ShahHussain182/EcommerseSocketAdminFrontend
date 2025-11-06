"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { ProductFormValues } from '../../schemas/productSchema';
import { FormErrorMessage } from '../ui/FormErrorMessage';

interface ProductVariantsSectionProps {
  isSubmitButtonDisabled: boolean;
}

export const ProductVariantsSection = ({ isSubmitButtonDisabled }: ProductVariantsSectionProps) => {
  const { control, register, formState: { errors } } = useFormContext<ProductFormValues>();

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  return (
    <div className="space-y-3 border p-4 rounded-md">
      <div className="flex items-center justify-between">
        <Label>Product Variants (Optional)</Label>
        <Button type="button" onClick={() => appendVariant({ size: '', color: '', price: 0, stock: 0 })} size="sm" disabled={isSubmitButtonDisabled}>
          <Plus className="mr-2 h-3 w-3" />
          Add Variant
        </Button>
      </div>

      {variantFields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-5 gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Size (Optional)</Label>
            <Input
              {...register(`variants.${index}.size`)}
              placeholder="S, M, L"
              disabled={isSubmitButtonDisabled}
            />
            {errors.variants?.[index]?.size && <FormErrorMessage message={String(errors.variants[index]?.size?.message)} />}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Color (Optional)</Label>
            <Input
              {...register(`variants.${index}.color`)}
              placeholder="Black, White"
              disabled={isSubmitButtonDisabled}
            />
            {errors.variants?.[index]?.color && <FormErrorMessage message={String(errors.variants[index]?.color?.message)} />}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Price</Label>
            <Input
              type="number"
              {...register(`variants.${index}.price`, { valueAsNumber: true })}
              step="0.01"
              min="0"
              disabled={isSubmitButtonDisabled}
            />
            {errors.variants?.[index]?.price && <FormErrorMessage message={String(errors.variants[index]?.price?.message)} />}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Stock</Label>
            <Input
              type="number"
              {...register(`variants.${index}.stock`, { valueAsNumber: true })}
              min="0"
              disabled={isSubmitButtonDisabled}
            />
            {errors.variants?.[index]?.stock && <FormErrorMessage message={String(errors.variants[index]?.stock?.message)} />}
          </div>
          <Button
            type="button"
            onClick={() => removeVariant(index)}
            variant="ghost"
            size="icon"
            disabled={variantFields.length === 1 || isSubmitButtonDisabled}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      {errors.variants?.root && <FormErrorMessage message={String(errors.variants.root.message)} />}
    </div>
  );
};