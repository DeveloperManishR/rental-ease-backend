import { z } from "zod";

const isValidDateString = (value) => !Number.isNaN(new Date(value).getTime());

const isTodayOrFuture = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;

    const inputDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return inputDay >= todayDay;
};

export const createPropertySchema = z.object({
    body: z.object({
        title: z
            .string({ required_error: "Title is required" })
            .min(3, "Title must be at least 3 characters")
            .max(200, "Title must not exceed 200 characters")
            .trim(),

        description: z
            .string({ required_error: "Description is required" })
            .min(10, "Description must be at least 10 characters"),

        location: z
            .string({ required_error: "Location is required" })
            .min(3, "Location must be at least 3 characters"),

        city: z
            .string({ required_error: "City is required" })
            .min(2, "City must be at least 2 characters")
            .trim(),

        rent: z
            .number({ required_error: "Rent is required" })
            .positive("Rent must be a positive number"),

        deposit: z.number().min(0, "Deposit cannot be negative").optional(),

        amenities: z.array(z.string()).optional(),
        rules: z.array(z.string()).optional(),
        images: z.array(z.string()).optional(),

        availableFrom: z
            .string()
            .refine(isValidDateString, { message: "Invalid date format" })
            .refine(isTodayOrFuture, { message: "Available from date cannot be in the past" })
            .optional(),
    }),
});

export const updatePropertySchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200).trim().optional(),
        description: z.string().min(10).optional(),
        location: z.string().min(3).optional(),
        city: z.string().min(2).trim().optional(),
        rent: z.number().positive().optional(),
        deposit: z.number().min(0).optional(),
        amenities: z.array(z.string()).optional(),
        rules: z.array(z.string()).optional(),
        images: z.array(z.string()).optional(),
        availableFrom: z
            .string()
            .refine(isValidDateString, { message: "Invalid date format" })
            .refine(isTodayOrFuture, { message: "Available from date cannot be in the past" })
            .optional(),
    }),
});
