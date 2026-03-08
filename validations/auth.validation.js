import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .trim(),

    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .trim()
      .toLowerCase(),

    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters"),

    role: z.enum(["admin", "owner", "tenant"], {
      required_error: "Role is required",
      invalid_type_error: "Role must be admin, owner, or tenant",
    }),

    phone: z
      .string()
      .regex(/^[0-9]{10,15}$/, "Phone number must be 10–15 digits")
      .optional()
      .or(z.literal("")),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  }),
});
