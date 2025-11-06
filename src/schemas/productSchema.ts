import { z } from "zod";

// Custom validation for MongoDB ObjectId strings (frontend-safe regex)
const objectIdSchema = z.string().refine(
  (val) => /^[0-9a-fA-F]{24}$/.test(val),
  {
    message: "Invalid ObjectId format",
  }
);

export const variantSchema = z.object({
  _id: z.string().optional(), // Optional for new variants, required for existing ones
  size: z.string().optional(), // Made optional
  color: z.string().optional(), // Made optional
  price: z.number().min(0, "Price cannot be negative."),
  stock: z.number().int().min(0, "Stock cannot be negative."),
});

// Custom URL validation to allow both absolute and relative paths
const imageUrlSchema = z.string().refine(
  (val) => {
    // Check if it's an absolute URL or a relative path starting with '/'
    return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
  },
  {
    message: "Must be a valid URL or a relative path (e.g., /image.jpg).",
  }
);

export const createProductSchema = z.object({
  name: z.string().min(3, "Product name is required and must be at least 3 characters."),
  description: z.string().min(10, "Product description is required and must be at least 10 characters."),
  category: z.string().min(1, "Category is required."),
  imageFiles: z.array(z.instanceof(File))
    .refine((files) => files.length > 0, "At least one image is required.")
    .refine((files) => files.length <= 5, "Maximum of 5 images allowed."),
  isFeatured: z.boolean().default(false),
  variants: z.array(variantSchema).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters.").optional(),
  description: z.string().min(10, "Product description must be at least 10 characters.").optional(),
  category: z.string().min(1, "Category is required.").optional(),
  imageUrls: z.array(imageUrlSchema)
    .min(1, "At least one image URL is required.")
    .max(5, "Maximum of 5 images allowed.")
    .optional(),
  isFeatured: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
}).partial();

export type ProductFormValues = z.infer<typeof createProductSchema> & z.infer<typeof updateProductSchema>;