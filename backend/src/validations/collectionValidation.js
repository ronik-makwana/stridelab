import { z } from "zod";

const conditionSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: z.enum(
    [
      // Number operators
      "eq",
      "not_eq",
      "greater_than",
      "greater_than_or_equal",
      "less_than",
      "less_than_or_equal",
      // String operators
      "contains",
      "does_not_contain",
      "starts_with",
      "ends_with",
    ],
    {
      errorMap: () => ({ message: "Operator is required and must be valid" }),
    }
  ),
  value: z.string().min(1, "Value is required"),
});

export const createCollectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  image: z
    .string()
    .url("Image must be a valid URL")
    .optional()
    .or(z.literal("")),
  type: z.enum(["manual", "automatic"]).default("manual"),
  products: z.array(z.string()).optional(),
  rules: z.array(conditionSchema).optional(),
  ruleMatchType: z.enum(["all", "any"]).default("all"),
});

export const updateCollectionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  image: z
    .string()
    .url("Image must be a valid URL")
    .optional()
    .or(z.literal("")),
  type: z.enum(["manual", "automatic"]).optional(),
  products: z.array(z.string()).optional(),
  rules: z.array(conditionSchema).optional(),
  ruleMatchType: z.enum(["all", "any"]).optional(),
});
