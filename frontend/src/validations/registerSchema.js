import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z
      .string({ required_error: "First name is required" })
      .min(1, "First name is required"),
    lastName: z
      .string({ required_error: "Last name is required" })
      .min(1, "Last name is required"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Enter a valid email")
      .trim(),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string({ required_error: "Please confirm your password" })
      .min(6, "Confirm password must be at least 6 characters long"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
