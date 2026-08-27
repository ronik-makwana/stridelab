import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least one image is required"),
  price: z.number().positive("Price must be a positive number"),
  discountedPrice: z.number().positive("Discounted price must be a positive number").optional(),
  category: z.enum(["men", "women", "kids"], {
    errorMap: () => ({ message: "Category must be men, women, or kids" }),
  }),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  collections: z.array(z.string()).optional(), // array of collection IDs
});

export const updateProductSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least one image is required")
    .optional(),
  price: z.number().positive("Price must be a positive number").optional(),
  discountedPrice: z.number().positive("Discounted price must be a positive number").optional(),
  category: z.enum(["men", "women", "kids"]).optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  collections: z.array(z.string()).optional(), // array of collection IDs
});

