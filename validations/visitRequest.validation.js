import { z } from "zod";

export const createVisitRequestSchema = z.object({
    body: z.object({
        propertyId: z.string({ required_error: "Property ID is required" }),

        preferredDate: z
            .string({ required_error: "Preferred date is required" })
            .datetime({ message: "Invalid date format" }),
    }),
});

export const updateVisitStatusSchema = z.object({
    body: z.object({
        status: z.enum(["scheduled", "visited", "decision"], {
            required_error: "Status is required",
            invalid_type_error: "Status must be scheduled, visited, or decision",
        }),

        ownerNote: z.string().optional(),
    }),
});
