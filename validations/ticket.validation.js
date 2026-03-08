import { z } from "zod";

export const createTicketSchema = z.object({
    body: z.object({
        title: z
            .string({ required_error: "Title is required" })
            .min(3, "Title must be at least 3 characters")
            .max(200, "Title must not exceed 200 characters")
            .trim(),

        message: z
            .string({ required_error: "Initial message is required" })
            .min(1, "Message cannot be empty"),
    }),
});

export const addMessageSchema = z.object({
    body: z.object({
        message: z
            .string({ required_error: "Message is required" })
            .min(1, "Message cannot be empty"),
    }),
});
